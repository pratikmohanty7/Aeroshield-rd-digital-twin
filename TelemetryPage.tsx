import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Radio,
  Wifi,
  ArrowRight,
  Binary,
  Layers,
  AlertTriangle,
  Activity,
  Sliders,
  RefreshCw,
  SlidersHorizontal,
  CheckCircle2,
  HardDrive,
  Cpu,
  Clock,
  Zap,
} from 'lucide-react';
import { formatPercent, formatNumber, formatElapsedSeconds } from '../utils/formatters';

export const TelemetryPage: React.FC = () => {
  const {
    telemetryStats,
    latestPacket,
    commState,
    healthBreakdown,
    obdsState,
    injectFault,
    recoverAllFaults,
    sensors,
    timeSeconds,
  } = useApp();

  const [frameView, setFrameView] = useState<'dissected' | 'structured' | 'raw_hex'>('dissected');
  
  // Interactive RF Channel Controls
  const [rfCarrierBand, setRfCarrierBand] = useState<'S_BAND' | 'UHF' | 'X_BAND'>('S_BAND');
  const [linkDistanceKm, setLinkDistanceKm] = useState<number>(14.5);
  const [antennaGainDbi, setAntennaGainDbi] = useState<number>(12);
  const [selectedByteIndex, setSelectedByteIndex] = useState<number | null>(null);

  // Dynamic RF calculation
  const dynamicRssi = useMemo(() => {
    if (commState === 'INTERRUPTED') return -118.0;
    // Free space path loss model roughly:
    const baseRssi = -55.0;
    const distanceLoss = Math.log10(Math.max(1, linkDistanceKm)) * 22;
    const gainBonus = antennaGainDbi * 0.8;
    return parseFloat((baseRssi - distanceLoss + gainBonus).toFixed(1));
  }, [commState, linkDistanceKm, antennaGainDbi]);

  const dynamicSnr = useMemo(() => {
    return Math.max(2, parseFloat((dynamicRssi + 120.0).toFixed(1)));
  }, [dynamicRssi]);

  const dynamicBer = useMemo(() => {
    if (dynamicSnr > 15) return '< 1e-8';
    if (dynamicSnr > 8) return '3.2e-6';
    return '1.4e-3 [MARGINAL]';
  }, [dynamicSnr]);

  // Telemetry frame field definitions for dissection
  const packetFields = [
    { start: 0, len: 2, name: 'SYNC PREAMBLE', val: '0xAA55', desc: 'Frame synchronizer word', color: 'text-amber-400' },
    { start: 2, len: 2, name: 'SEQUENCE #', val: `#${telemetryStats.currentSequence}`, desc: 'Monotonic frame index', color: 'text-sky-300' },
    { start: 4, len: 4, name: 'TIME STAMP', val: `T+${timeSeconds.toFixed(1)}s`, desc: 'Onboard 100MHz timebase', color: 'text-slate-200' },
    { start: 8, len: 4, name: 'INS ACCEL Z', val: `${formatNumber(sensors.IMU.primaryValue, 2)} G`, desc: 'Triaxial proof mass', color: 'text-emerald-400' },
    { start: 12, len: 4, name: 'GNSS ALTITUDE', val: `${formatNumber(sensors.GNSS.primaryValue, 1)} m`, desc: 'Geodetic MSL elevation', color: 'text-sky-400' },
    { start: 16, len: 4, name: 'STATIC BARO', val: `${formatNumber(sensors.PRESSURE.primaryValue, 1)} hPa`, desc: 'Pitot static pressure', color: 'text-white' },
    { start: 20, len: 2, name: 'CORE TEMP', val: `${formatNumber(sensors.TEMPERATURE.primaryValue, 1)} °C`, desc: 'PCB junction thermal', color: 'text-amber-300' },
    { start: 22, len: 2, name: 'BUS VOLTAGE', val: `${formatNumber(sensors.POWER.primaryValue, 1)} V`, desc: '28V primary supply', color: 'text-emerald-300' },
    { start: 24, len: 2, name: 'HEALTH BYTE', val: `${healthBreakdown.systemHealthIndex}%`, desc: 'Aggregated 0-100 index', color: 'text-sky-300' },
    { start: 26, len: 2, name: 'OBDS STATUS', val: obdsState.status, desc: 'BITE fault code status', color: 'text-emerald-400' },
    { start: 28, len: 2, name: 'CRC-16 FCS', val: '0x8F3C', desc: 'CCITT cyclic polynomial', color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-4 max-w-[1780px] mx-auto text-slate-100 font-sans">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f2533]">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-0.5">
            <span>Downlink Telemetry Engine</span>
            <span>·</span>
            <span className="text-emerald-400">115.2 kbps S-Band Active</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Telemetry Bus &amp; High-Rate Frame Transmission</span>
          </h1>
        </div>

        {/* Operational Context Indicators */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635]">
            <span className="text-slate-400 text-[11px]">Carrier RSSI:</span>
            <span className={`font-bold tabular-nums ${dynamicRssi > -95 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dynamicRssi} dBm
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-[#121620] border border-[#1f2635]">
            <span className="text-slate-400 text-[11px]">BER:</span>
            <span className="text-white font-bold">{dynamicBer}</span>
          </div>
        </div>
      </div>

      {/* 2. TELEMETRY LINK PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
        <div className="p-3 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Downlink State</span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm font-bold text-white uppercase">{telemetryStats.streamStatus}</span>
            <StatusBadge status={commState} size="sm" />
          </div>
          <span className="text-[10px] text-slate-500 block font-sans">Single-direction telemetry downlink</span>
        </div>

        <div className="p-3 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Data Rate</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-sky-300">115.2 kbps</span>
            <span className="text-[10px] text-slate-400">200 Hz Ref / 10 Hz UI</span>
          </div>
          <span className="text-[10px] text-slate-500 block font-sans">Deterministic FIFO framing</span>
        </div>

        <div className="p-3 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Frames Delivered</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-white tabular-nums">
              {telemetryStats.packetsGenerated.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Seq #{telemetryStats.currentSequence}</span>
          </div>
          <span className="text-[10px] text-slate-500 block font-sans">Dropped: {telemetryStats.packetsDropped} frames</span>
        </div>

        <div className="p-3 rounded-sm bg-[#11141c] border border-[#1e2330] space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Delivery Reliability</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-bold text-emerald-400 tabular-nums">
              {formatPercent(100 - (telemetryStats.packetsDropped > 0 ? 14.2 : 0.02))}
            </span>
            <span className="text-[10px] text-slate-400">{telemetryStats.averageLatencyMs.toFixed(1)} ms</span>
          </div>
          <span className="text-[10px] text-slate-500 block font-sans">CRC-16 validation confirmed</span>
        </div>
      </div>

      {/* 3. INTERACTIVE RF LINK PROPAGATION CONTROLLER & CONSTELLATION */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1b202c]">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-sky-400" />
            <span className="text-white font-bold uppercase text-[11px]">
              Interactive RF Propagation Channel &amp; Antenna Parameters
            </span>
          </div>
          <span className="text-slate-400 text-[10px]">
            Free Space Path Loss (FSPL) Simulation
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Sliders */}
          <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Slant Range Distance:</span>
              <span className="text-white font-bold tabular-nums">{linkDistanceKm} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={linkDistanceKm}
              onChange={(e) => setLinkDistanceKm(parseFloat(e.target.value))}
              className="w-full h-1 bg-[#1a202c] rounded-xs accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>1 km (Muzzle Exit)</span>
              <span>50 km (Apogee / Standoff)</span>
            </div>
          </div>

          <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Ground Station Antenna Gain:</span>
              <span className="text-sky-300 font-bold tabular-nums">+{antennaGainDbi} dBi</span>
            </div>
            <input
              type="range"
              min="3"
              max="24"
              step="1"
              value={antennaGainDbi}
              onChange={(e) => setAntennaGainDbi(parseInt(e.target.value))}
              className="w-full h-1 bg-[#1a202c] rounded-xs accent-sky-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>Omni (+3 dBi)</span>
              <span>High-Gain Tracking (+24 dBi)</span>
            </div>
          </div>

          <div className="p-3 rounded-sm bg-[#0d1017] border border-[#1a1f2c] space-y-2 flex flex-col justify-between">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Carrier Frequency Band:</span>
              <span className="text-emerald-400 font-bold">2.2 GHz S-BAND</span>
            </div>
            <div className="flex items-center gap-1.5">
              {(['S_BAND', 'UHF', 'X_BAND'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setRfCarrierBand(b)}
                  className={`flex-1 py-1 rounded-xs text-[10px] font-bold transition-colors ${
                    rfCarrierBand === b
                      ? 'bg-sky-700 text-white'
                      : 'bg-[#141822] text-slate-400 hover:text-white'
                  }`}
                >
                  {b.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-[#181d27]">
              <span>SNR: <strong className="text-white">{dynamicSnr} dB</strong></span>
              <span>Modulation: <strong className="text-white">FSK / QPSK</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ACTIVE TELEMETRY FRAME DISSECTOR & BYTE-LEVEL INSPECTOR */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1b202c]">
          <div className="flex items-center gap-2">
            <Binary size={15} className="text-sky-400" />
            <h2 className="text-white font-bold uppercase text-[11px]">
              Active Telemetry Frame Dissector (64-Byte Packet Stream)
            </h2>
          </div>

          <div className="flex items-center gap-1 bg-[#0d1017] border border-[#1d2330] rounded-sm p-0.5 text-xs">
            <button
              onClick={() => setFrameView('dissected')}
              className={`px-2.5 py-0.5 rounded-xs text-[10px] transition-colors ${
                frameView === 'dissected'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Field Dissector
            </button>
            <button
              onClick={() => setFrameView('structured')}
              className={`px-2.5 py-0.5 rounded-xs text-[10px] transition-colors ${
                frameView === 'structured'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              JSON Structure
            </button>
            <button
              onClick={() => setFrameView('raw_hex')}
              className={`px-2.5 py-0.5 rounded-xs text-[10px] transition-colors ${
                frameView === 'raw_hex'
                  ? 'bg-sky-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hex Matrix
            </button>
          </div>
        </div>

        {/* VIEW 1: FIELD DISSECTOR TABLE */}
        {frameView === 'dissected' && (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1b202c] text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="py-2 px-2.5">Offset</th>
                    <th className="py-2 px-2.5">Telemetry Field</th>
                    <th className="py-2 px-2.5">Decoded Value</th>
                    <th className="py-2 px-2.5">Field Specification</th>
                    <th className="py-2 px-2.5 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#161a24]">
                  {packetFields.map((f, i) => (
                    <tr
                      key={i}
                      onClick={() => setSelectedByteIndex(i)}
                      className={`hover:bg-[#141822] cursor-pointer transition-colors ${
                        selectedByteIndex === i ? 'bg-[#182335]' : ''
                      }`}
                    >
                      <td className="py-2 px-2.5 text-slate-500 font-bold">
                        +{f.start.toString().padStart(2, '0')} [{f.len}B]
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-200">
                        {f.name}
                      </td>
                      <td className={`py-2 px-2.5 font-bold tabular-nums ${f.color}`}>
                        {f.val}
                      </td>
                      <td className="py-2 px-2.5 text-slate-400 text-[11px] font-sans">
                        {f.desc}
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <span className="text-[10px] font-bold text-emerald-400">
                          VALID
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Field Quick Inspector */}
            {selectedByteIndex !== null && (
              <div className="p-3 rounded-sm bg-[#0d1017] border border-sky-800/40 text-xs space-y-1">
                <span className="text-[10px] text-sky-400 uppercase font-semibold">
                  Field Inspector: {packetFields[selectedByteIndex].name}
                </span>
                <p className="text-slate-300 font-sans text-xs">
                  {packetFields[selectedByteIndex].desc}. Active decoded representation: <strong className="text-white">{packetFields[selectedByteIndex].val}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: STRUCTURED JSON VIEW */}
        {frameView === 'structured' && latestPacket && (
          <pre className="p-3 rounded-sm bg-[#090b10] border border-[#161a24] text-xs text-sky-300 overflow-x-auto max-h-80 font-mono leading-relaxed">
            {JSON.stringify(
              {
                header: {
                  packetId: latestPacket.id,
                  sequenceNumber: latestPacket.sequence,
                  referenceRateHz: latestPacket.referenceRateHz,
                  displayRateHz: latestPacket.displayRateHz,
                  timeSeconds: timeSeconds.toFixed(2),
                  timestampUtc: new Date(latestPacket.timestamp).toISOString(),
                },
                flightDynamics: {
                  mach: (sensors.IMU.primaryValue * 0.85).toFixed(2),
                  gLoad: sensors.IMU.primaryValue.toFixed(2),
                  altM: sensors.GNSS.primaryValue.toFixed(1),
                  staticHpa: sensors.PRESSURE.primaryValue.toFixed(1),
                },
                healthSupervisor: {
                  systemHealth: `${healthBreakdown.systemHealthIndex}/100`,
                  obdsStatus: obdsState.status,
                  dataQuality: `${healthBreakdown.subscores.dataQuality}%`,
                  commState: commState,
                  rssiDb: `${dynamicRssi} dBm`,
                },
              },
              null,
              2
            )}
          </pre>
        )}

        {/* VIEW 3: HEX BYTE MATRIX */}
        {frameView === 'raw_hex' && (
          <div className="space-y-3">
            <div className="p-3 rounded-sm bg-[#090b10] border border-[#161a24] space-y-2">
              <span className="text-[10px] text-slate-500 uppercase block">
                Hex Matrix (64 Bytes per Packet Frame)
              </span>
              <div className="grid grid-cols-8 sm:grid-cols-16 gap-1 font-bold text-center text-xs">
                {Array.from({ length: 32 }).map((_, i) => {
                  const val = ((telemetryStats.currentSequence * 31 + i * 17) % 256)
                    .toString(16)
                    .toUpperCase()
                    .padStart(2, '0');
                  const byteText = i === 0 ? 'AA' : i === 1 ? '55' : val;
                  return (
                    <span
                      key={i}
                      className="p-1 rounded-xs bg-[#121620] border border-[#1c2230] text-sky-300 hover:bg-sky-900/40 hover:text-white transition-colors cursor-pointer"
                    >
                      {byteText}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Frame CRC-16: <strong className="text-emerald-400">0x8F3C [VALID]</strong></span>
              <span>Framing Standard: MIL-STD-1553 Telemetry Wrap</span>
            </div>
          </div>
        )}
      </section>

      {/* 5. INTERACTIVE RF LINK FAULT TESTING & RECOVERY */}
      <section className="bg-[#11141c] border border-[#1e2330] rounded-sm p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#1b202c]">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <h3 className="text-white font-bold uppercase text-[11px]">
              RF Link Disturbance &amp; Downlink Attenuation Stimulus
            </h3>
          </div>
          <span className="text-slate-400 text-[10px]">
            Test ground station resilience to RF dropout
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => injectFault('COMMUNICATION_INTERRUPTION')}
            disabled={commState === 'INTERRUPTED'}
            className={`p-2.5 rounded-sm border text-left transition-colors ${
              commState === 'INTERRUPTED'
                ? 'bg-rose-950/40 border-rose-600 text-rose-300 cursor-not-allowed'
                : 'bg-[#0d1017] hover:bg-[#151a24] text-slate-300 border-[#1e2330] hover:border-slate-500'
            }`}
          >
            <span className="text-white font-bold block">Inject Link Dropout</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
              Simulates severe RF fade and packet loss &gt; 85%
            </span>
          </button>

          <button
            onClick={() => {
              setLinkDistanceKm(48.0);
              setAntennaGainDbi(3);
            }}
            className="p-2.5 rounded-sm bg-[#0d1017] hover:bg-[#151a24] border border-[#1e2330] hover:border-slate-500 text-left transition-colors"
          >
            <span className="text-white font-bold block">Max Range Attenuation</span>
            <span className="text-[10px] text-slate-400 block font-sans mt-0.5">
              Simulates maximum slant range (48 km) with low-gain antenna
            </span>
          </button>

          <button
            onClick={() => {
              recoverAllFaults();
              setLinkDistanceKm(14.5);
              setAntennaGainDbi(12);
            }}
            className="p-2.5 rounded-sm bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 text-left transition-colors flex flex-col justify-between"
          >
            <span className="font-bold block">Restore Nominal RF Link</span>
            <span className="text-[10px] text-emerald-400 block font-sans mt-0.5">
              Restores optimal S-Band carrier and clears packet drop
            </span>
          </button>
        </div>
      </section>

    </div>
  );
};
