import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Compass,
  Navigation,
  Gauge,
  Activity,
  AlertTriangle,
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Zap,
  Info,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import { formatNumber, formatPercent } from '../utils/formatters';

export const StateEstimationPage: React.FC = () => {
  const {
    stateEstimation,
    sensors,
    activeFaults,
    injectFault,
    recoverAllFaults,
    setActivePage,
    timeSeconds,
  } = useApp();

  // Interactive EKF Tuning Parameters
  const [qProcessNoise, setQProcessNoise] = useState<number>(0.05);
  const [rMeasurementNoise, setRMeasurementNoise] = useState<number>(0.12);
  const [chiSquareThreshold, setChiSquareThreshold] = useState<number>(3.0);
  const [selectedKalmanState, setSelectedKalmanState] = useState<'POS' | 'VEL' | 'ATT'>('POS');

  const isGnssDegraded = sensors.GNSS.status !== 'NORMAL';
  const isImuDegraded = sensors.IMU.status !== 'NORMAL';
  const isMagDegraded = sensors.MAGNETOMETER.status !== 'NORMAL';

  return (
    <div className="space-y-4 max-w-[1780px] mx-auto text-slate-100 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            <span>Navigation Filter Engine</span>
            <span>·</span>
            <span className="text-sky-400">Coupled GPS/INS Extended Kalman Filter</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Kinematic State Estimation &amp; Sensor Fusion</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635]">
            <span className="text-slate-400 text-[11px]">Filter Confidence:</span>
            <span className={`font-bold tabular-nums ${
              stateEstimation.confidence >= 80 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {stateEstimation.confidence}%
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635]">
            <span className="text-slate-400 text-[11px]">Active Feeds:</span>
            <span className="text-white font-bold">
              {Object.values(sensors).filter((s) => s.status === 'NORMAL').length} of 6
            </span>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY 4 STATE TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono text-xs">
        {/* Tile 1: Position Estimate */}
        <div className="p-3.5 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="font-bold uppercase text-sky-400 flex items-center gap-1.5">
              <Navigation size={12} />
              Position Vector
            </span>
            <span>WGS-84 ECEF</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Position X (East):</span>
              <span className="text-white font-bold tabular-nums">
                +{(stateEstimation.positionEstimate.x / 1000).toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Position Y (North):</span>
              <span className="text-white font-bold tabular-nums">
                {stateEstimation.positionEstimate.y >= 0 ? '+' : ''}
                {(stateEstimation.positionEstimate.y / 1000).toFixed(2)} km
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Altitude MSL:</span>
              <span className="text-sky-300 font-bold tabular-nums">
                {stateEstimation.positionEstimate.altitudeM.toFixed(1)} m
              </span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#181d27] flex justify-between text-[10px] text-slate-500">
            <span>Source:</span>
            <span className={isGnssDegraded ? 'text-amber-400' : 'text-emerald-400'}>
              {isGnssDegraded ? 'Baro + Dead-Reckoning' : 'GNSS Carrier Phase'}
            </span>
          </div>
        </div>

        {/* Tile 2: Velocity & Kinematics */}
        <div className="p-3.5 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="font-bold uppercase text-sky-400 flex items-center gap-1.5">
              <Activity size={12} />
              Kinematic Motion
            </span>
            <span>STRAPDOWN INS</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Velocity:</span>
              <span className="text-white font-bold tabular-nums">
                {stateEstimation.motionEstimate.velocityMps.toFixed(1)} m/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Calibrated Mach:</span>
              <span className="text-sky-300 font-bold tabular-nums">
                Mach {(stateEstimation.motionEstimate.velocityMps / 343).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Inertial G-Load:</span>
              <span className="text-white font-bold tabular-nums">
                {stateEstimation.motionEstimate.accelG.toFixed(2)} G
              </span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#181d27] flex justify-between text-[10px] text-slate-500">
            <span>Angular Rate:</span>
            <span className="text-emerald-400">{stateEstimation.motionEstimate.angularRateDps.toFixed(1)} °/s</span>
          </div>
        </div>

        {/* Tile 3: Attitude & Orientation */}
        <div className="p-3.5 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="font-bold uppercase text-sky-400 flex items-center gap-1.5">
              <Compass size={12} />
              Attitude Angles
            </span>
            <span>EULER (3-2-1)</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Elevation Pitch:</span>
              <span className="text-white font-bold tabular-nums">
                +{stateEstimation.orientationEstimate.pitchDeg.toFixed(1)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Azimuth Yaw:</span>
              <span className="text-white font-bold tabular-nums">
                {stateEstimation.orientationEstimate.yawDeg.toFixed(1)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Despin Roll:</span>
              <span className="text-sky-300 font-bold tabular-nums">
                {stateEstimation.orientationEstimate.rollDeg.toFixed(1)}°
              </span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#181d27] flex justify-between text-[10px] text-slate-500">
            <span>Attitude Source:</span>
            <span className={isMagDegraded ? 'text-amber-400' : 'text-emerald-400'}>
              {isMagDegraded ? 'Rate Gyro Only' : 'Gyro + Magnetometer'}
            </span>
          </div>
        </div>

        {/* Tile 4: Estimator Health & Residuals */}
        <div className="p-3.5 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="font-bold uppercase text-sky-400 flex items-center gap-1.5">
              <ShieldCheck size={12} />
              Estimator Mode
            </span>
            <span>RESIDUAL GATE</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Mode:</span>
              <span className={`font-bold ${isGnssDegraded ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isGnssDegraded ? 'INS / Baro Fallback' : 'Coupled GPS / INS'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Innovation Chi-Sq:</span>
              <span className="text-white font-bold tabular-nums">
                {isGnssDegraded ? '4.82 [REJECT]' : '1.14 [NOMINAL]'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Covariance Trace:</span>
              <span className="text-sky-300 font-bold tabular-nums">
                {isGnssDegraded ? '0.084 m²' : '0.012 m²'}
              </span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#181d27] flex justify-between text-[10px] text-slate-500">
            <span>Filter Status:</span>
            <span className="text-emerald-400">CONVERGED</span>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE EKF COVARIANCE & RESIDUAL TUNING CONSOLE */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1b202c]">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-sky-400" />
            <h2 className="text-white font-bold uppercase text-[11px]">
              Interactive EKF Covariance Tuning &amp; Innovation Gates
            </h2>
          </div>
          <span className="text-slate-400 text-[10px]">
            Kalman Gain Weight Matrix Adjustment
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Slider Q */}
          <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Process Noise Covariance (Q):</span>
              <span className="text-white font-bold tabular-nums">{qProcessNoise.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.005"
              max="0.2"
              step="0.005"
              value={qProcessNoise}
              onChange={(e) => setQProcessNoise(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#1a202c] rounded-xs accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block font-sans">
              Higher Q increases filter responsiveness to sudden canard maneuvers.
            </span>
          </div>

          {/* Slider R */}
          <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Measurement Noise Covariance (R):</span>
              <span className="text-sky-300 font-bold tabular-nums">{rMeasurementNoise.toFixed(3)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.5"
              step="0.01"
              value={rMeasurementNoise}
              onChange={(e) => setRMeasurementNoise(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#1a202c] rounded-xs accent-sky-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block font-sans">
              Higher R suppresses GPS multipath and pitot acoustic turbulence.
            </span>
          </div>

          {/* Outlier Gate */}
          <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Innovation Chi-Square Gate:</span>
              <span className="text-emerald-400 font-bold tabular-nums">{chiSquareThreshold} σ</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[2.0, 3.0, 4.0].map((t) => (
                <button
                  key={t}
                  onClick={() => setChiSquareThreshold(t)}
                  className={`flex-1 py-1 rounded-xs text-[10px] font-bold transition-colors ${
                    chiSquareThreshold === t
                      ? 'bg-sky-700 text-white'
                      : 'bg-[#141822] text-slate-400 hover:text-white'
                  }`}
                >
                  {t}.0 σ Gate
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-[#181d27]">
              <span>Gating State: <strong className="text-emerald-400">ACTIVE</strong></span>
              <button
                onClick={() => {
                  setQProcessNoise(0.05);
                  setRMeasurementNoise(0.12);
                  setChiSquareThreshold(3.0);
                }}
                className="text-sky-400 hover:underline"
              >
                Reset Defaults
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SENSOR FUSION RESILIENCE TESTING */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#1b202c]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <h3 className="text-white font-bold uppercase text-[11px]">
              Estimator Stress Injection &amp; Fallback Verification
            </h3>
          </div>
          <button
            onClick={recoverAllFaults}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xs bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold transition-colors"
          >
            <RotateCcw size={11} />
            <span>Restore All Signals</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => injectFault('GNSS_LOSS')}
            disabled={isGnssDegraded}
            className={`p-3 rounded-sm border text-left transition-colors ${
              isGnssDegraded
                ? 'bg-amber-950/40 border-amber-600 text-amber-300 cursor-not-allowed'
                : 'bg-[#0d1017] hover:bg-[#151a24] text-slate-300 border-[#1e2330] hover:border-slate-500'
            }`}
          >
            <span className="text-white font-bold block">Inject Satellite Lock Loss</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
              Simulates GPS denial; forces transition into dead-reckoning fallback
            </span>
          </button>

          <button
            onClick={() => injectFault('IMU_BIAS')}
            disabled={isImuDegraded}
            className={`p-3 rounded-sm border text-left transition-colors ${
              isImuDegraded
                ? 'bg-rose-950/40 border-rose-600 text-rose-300 cursor-not-allowed'
                : 'bg-[#0d1017] hover:bg-[#151a24] text-slate-300 border-[#1e2330] hover:border-slate-500'
            }`}
          >
            <span className="text-white font-bold block">Inject IMU Bias Excursion</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
              Tests innovation residual screening and covariance inflation
            </span>
          </button>

          <button
            onClick={() => injectFault('STALE_DATA')}
            disabled={sensors.PRESSURE.status === 'STALE'}
            className={`p-3 rounded-sm border text-left transition-colors ${
              sensors.PRESSURE.status === 'STALE'
                ? 'bg-amber-950/40 border-amber-600 text-amber-300 cursor-not-allowed'
                : 'bg-[#0d1017] hover:bg-[#151a24] text-slate-300 border-[#1e2330] hover:border-slate-500'
            }`}
          >
            <span className="text-white font-bold block">Inject Barometric Freeze</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
              Tests timestamp monotonicity check and freeze-detection watchdog
            </span>
          </button>
        </div>
      </section>

    </div>
  );
};
