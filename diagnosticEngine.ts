import { DiagnosticEvent, ObdsState } from '../types/diagnostics';
import { FaultConfig, SensorData, SensorType } from '../types/sensor';
import { CommState } from '../types/telemetry';

export function evaluateObds(
  sensors: Record<SensorType, SensorData>,
  commState: CommState,
  activeFaults: FaultConfig[],
  currentTimeEpoch: number,
  existingEvents: DiagnosticEvent[],
  sessionId: string
): { obdsState: ObdsState; newEvents: DiagnosticEvent[]; updatedEvents: DiagnosticEvent[] } {
  const subsystemStatuses: Record<string, 'HEALTHY' | 'ANOMALY' | 'ISOLATED' | 'OFFLINE'> = {
    GNSS_RECEIVER: 'HEALTHY',
    INERTIAL_MEASUREMENT: 'HEALTHY',
    AIR_DATA_PRESSURE: 'HEALTHY',
    POWER_MANAGEMENT: 'HEALTHY',
    THERMAL_BUS: 'HEALTHY',
    MAGNETIC_ATTITUDE: 'HEALTHY',
    TELEMETRY_TRANSCEIVER: 'HEALTHY',
  };

  const newEvents: DiagnosticEvent[] = [];
  const updatedEvents: DiagnosticEvent[] = [...existingEvents];

  // Helper to find existing event
  const findActiveEvent = (module: string, title: string) => {
    return updatedEvents.find((e) => e.module === module && e.title === title && e.status === 'ACTIVE');
  };

  // 1. Evaluate Active Faults & Latency Tracking
  for (const fault of activeFaults) {
    if (!fault.active) continue;

    let eventTitle = '';
    let module = '';
    let description = '';
    let severity: 'WARNING' | 'ERROR' | 'CRITICAL' = 'WARNING';
    let subsystemKey = '';
    let testId: string | undefined = undefined;
    const rootCauses: string[] = [];

    switch (fault.type) {
      case 'GNSS_LOSS':
        module = 'NAV_POSITIONING';
        eventTitle = 'GNSS Constellation Lock Loss';
        description = 'Satellite lock lost (0 tracked sats, HDOP invalidated). Switched to dead-reckoning fallback.';
        severity = 'ERROR';
        subsystemKey = 'GNSS_RECEIVER';
        testId = 'VT-02';
        rootCauses.push('Carrier-to-noise ratio fell below acquisition floor');
        rootCauses.push('Ephemeris frame decode timeout');
        break;

      case 'IMU_BIAS':
        module = 'INERTIAL_DYNAMICS';
        eventTitle = 'Accelerometric Unphysical Drift Bias';
        description = 'IMU Z-axis baseline static acceleration diverged past 1.6G. Dynamic model integrity compromised.';
        severity = 'ERROR';
        subsystemKey = 'INERTIAL_MEASUREMENT';
        testId = 'VT-04';
        rootCauses.push('Sensor proof-mass offset calibration bias detected');
        rootCauses.push('Exceeds static 1.0G gravity tolerance window');
        break;

      case 'STALE_DATA':
        module = 'DATA_ACQUISITION';
        eventTitle = 'Sensor Frame Latency Timeout (Stale Stream)';
        description = 'Sensor sample timestamps halted or exceeded 1.8s refresh budget.';
        severity = 'WARNING';
        subsystemKey = 'AIR_DATA_PRESSURE';
        testId = 'VT-03';
        rootCauses.push('SPI/I2C DMA FIFO buffer freeze or bus stall');
        break;

      case 'SENSOR_DROPOUT':
        module = 'SENSOR_BUS';
        eventTitle = 'Sensor Dropout / Channel Unavailable';
        description = 'Telemetry frames dropped from sensor transducer line.';
        severity = 'ERROR';
        subsystemKey = 'GNSS_RECEIVER';
        testId = 'VT-02';
        rootCauses.push('Electrical line discontinuity or peripheral driver timeout');
        break;

      case 'TEMPERATURE_SPIKE':
        module = 'THERMAL_PROTECTION';
        eventTitle = 'Critical Core Over-Temperature';
        description = 'Processor PCB core temperature reached 78°C, exceeding 65°C safe envelope.';
        severity = 'CRITICAL';
        subsystemKey = 'THERMAL_BUS';
        testId = 'VT-04';
        rootCauses.push('Heatsink thermal interface resistance or high current dissipation');
        break;

      case 'POWER_DEGRADATION':
        module = 'POWER_SUPERVISOR';
        eventTitle = 'Electrical Bus Undervoltage Brownout Risk';
        description = 'Main 24V supply dropped to 19.4V; auxiliary reserve discharging rapidly.';
        severity = 'CRITICAL';
        subsystemKey = 'POWER_MANAGEMENT';
        testId = 'VT-06';
        rootCauses.push('Input rail supply impedance collapse or excessive load draw');
        break;

      case 'COMMUNICATION_INTERRUPTION':
        module = 'TELEMETRY_LINK';
        eventTitle = 'Wireless Downlink Frame Packet Loss';
        description = 'Telemetry stream frame sequence drop rate rose above acceptable margin.';
        severity = 'WARNING';
        subsystemKey = 'TELEMETRY_TRANSCEIVER';
        testId = 'VT-06';
        rootCauses.push('Simulated link attenuation or packet collision');
        break;

      case 'SENSOR_DISAGREEMENT':
        module = 'SENSOR_FUSION';
        eventTitle = 'Multi-Sensor Attitude/Heading Cross-Disagreement';
        description = 'Magnetometer heading diverged by >90° from integrated gyro rate model.';
        severity = 'ERROR';
        subsystemKey = 'MAGNETIC_ATTITUDE';
        testId = 'VT-05';
        rootCauses.push('External magnetic anomaly or gyro scale factor disparity');
        break;
    }

    if (subsystemKey && subsystemStatuses[subsystemKey]) {
      subsystemStatuses[subsystemKey] = severity === 'CRITICAL' ? 'ISOLATED' : 'ANOMALY';
    }

    // Check if we already logged this active event
    const existing = findActiveEvent(module, eventTitle);
    if (!existing) {
      // Calculate detection latency: detectionTime - faultInjectionTime
      const detectionTime = currentTimeEpoch;
      const injectionTime = fault.injectionTime || (currentTimeEpoch - 120);
      const detectionLatencyMs = Math.max(12, detectionTime - injectionTime);

      const event: DiagnosticEvent = {
        id: `DIAG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
        timestamp: detectionTime,
        module,
        severity,
        title: eventTitle,
        description,
        status: 'ACTIVE',
        faultInjectionTime: injectionTime,
        detectionTime,
        detectionLatencyMs,
        sessionId,
        testId,
        recommendedAction: 'Engage fallback state estimator; notify R&D operator and log diagnostic evidence.',
        rootCauseTrace: rootCauses,
      };

      newEvents.push(event);
      updatedEvents.unshift(event);
    }
  }

  // If no faults are active, resolve active events
  if (activeFaults.filter((f) => f.active).length === 0) {
    for (let i = 0; i < updatedEvents.length; i++) {
      if (updatedEvents[i].status === 'ACTIVE') {
        updatedEvents[i] = {
          ...updatedEvents[i],
          status: 'RESOLVED',
          description: `${updatedEvents[i].description} [FAULT RECOVERED - NOMINAL RESTORED]`,
        };
      }
    }
  }

  // Calculate OBDS status
  const activeFaultCount = updatedEvents.filter((e) => e.status === 'ACTIVE').length;
  let obdsStatus: 'NORMAL' | 'WARNING' | 'DEGRADED' | 'FAILED' = 'NORMAL';

  if (activeFaultCount >= 2 || updatedEvents.some((e) => e.status === 'ACTIVE' && e.severity === 'CRITICAL')) {
    obdsStatus = 'FAILED';
  } else if (updatedEvents.some((e) => e.status === 'ACTIVE' && e.severity === 'ERROR')) {
    obdsStatus = 'DEGRADED';
  } else if (activeFaultCount > 0) {
    obdsStatus = 'WARNING';
  }

  const obdsState: ObdsState = {
    status: obdsStatus,
    builtInTestStatus: obdsStatus === 'NORMAL' ? 'PASSED' : obdsStatus === 'WARNING' ? 'WARNING' : 'FAILED',
    activeFaultCount,
    lastBitTimestamp: currentTimeEpoch,
    isolationConfidence: activeFaultCount > 0 ? 94 : 99,
    subsystemStatuses,
  };

  return { obdsState, newEvents, updatedEvents };
}
