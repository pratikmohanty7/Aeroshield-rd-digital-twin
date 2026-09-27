import React, { useState, useEffect, useRef } from 'react';
import { BUS_LOGIC_CHANNELS } from '../../data/missileArchitectureData';
import { BusLogicAnalyzerChannel } from '../../types/missileArchitecture';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Zap,
  Network,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

export const MissileLogicAnalyzer: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [timebase, setTimebase] = useState<'100ns' | '1us' | '10us' | '100us'>('1us');
  const [activeChannelId, setActiveChannelId] = useState<string>(BUS_LOGIC_CHANNELS[0].id);
  const [injectedFault, setInjectedFault] = useState<string | null>(null);
  const [packetCounter, setPacketCounter] = useState<number>(42890);
  const [phaseOffset, setPhaseOffset] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation loop for digital waveform oscilloscope
  useEffect(() => {
    let animId: number;

    const renderWaveforms = () => {
      if (isRunning) {
        setPhaseOffset((prev) => (prev + 1.5) % 360);
        setPacketCounter((prev) => prev + 1);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear dark background
      ctx.fillStyle = '#050a14';
      ctx.fillRect(0, 0, width, height);

      // Draw Oscilloscope Reticle Grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 0.5;
      const gridSpacingX = width / 10;
      const gridSpacingY = height / 8;

      for (let x = 0; x < width; x += gridSpacingX) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = 0; y < height; y += gridSpacingY) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw 4 Digital Logic Channels
      const channelHeight = height / 4;

      BUS_LOGIC_CHANNELS.forEach((channel, chIdx) => {
        const baseY = chIdx * channelHeight + channelHeight * 0.75;
        const highY = chIdx * channelHeight + channelHeight * 0.25;

        // Channel Label
        ctx.fillStyle = channel.color;
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillText(channel.name.split(':')[0], 10, baseY - channelHeight * 0.45);

        // Draw Logic Waveform
        ctx.strokeStyle = channel.color;
        ctx.lineWidth = 1.8;
        ctx.beginPath();

        let currentLevel = 0; // 0 = low, 1 = high
        let stepWidth = 14;

        if (timebase === '100ns') stepWidth = 8;
        else if (timebase === '1us') stepWidth = 16;
        else if (timebase === '10us') stepWidth = 24;
        else stepWidth = 36;

        let hasDrawnFirst = false;

        for (let x = 70; x < width; x += stepWidth) {
          // Synthetic deterministic pseudo-random logic bit pattern based on channel, phase and x
          const bitVal = Math.sin((x + phaseOffset * (chIdx + 1) * 2.5) * 0.05 + chIdx) > 0 ? 1 : 0;

          // Inject visual glitch if fault is active on this channel
          const isFailing =
            injectedFault &&
            ((injectedFault === 'PARITY_ERR' && chIdx === 0) ||
              (injectedFault === 'CAN_STUFFING' && chIdx === 1) ||
              (injectedFault === 'EMI_NOISE'));

          const noiseOffset = isFailing ? (Math.random() - 0.5) * 12 : 0;
          const targetY = (bitVal ? highY : baseY) + noiseOffset;

          if (!hasDrawnFirst) {
            ctx.moveTo(x, targetY);
            hasDrawnFirst = true;
          } else {
            // Clock transition edge
            ctx.lineTo(x, targetY);
          }

          // Transition to next horizontal step
          ctx.lineTo(x + stepWidth, targetY);
        }

        ctx.stroke();
      });

      animId = requestAnimationFrame(renderWaveforms);
    };

    animId = requestAnimationFrame(renderWaveforms);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, timebase, phaseOffset, injectedFault]);

  const activeChannel =
    BUS_LOGIC_CHANNELS.find((c) => c.id === activeChannelId) || BUS_LOGIC_CHANNELS[0];

  const handleInjectFault = (faultType: string) => {
    soundFX.click();
    setInjectedFault(injectedFault === faultType ? null : faultType);
  };

  return (
    <div className="bg-[#0b0f19] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl font-sans">
      {/* Top Header & Oscilloscope Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
            <Activity size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider text-xs">
                Real-Time Avionics Logic Analyzer &amp; Protocol Oscilloscope
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-semibold">
                {isRunning ? 'ACQUIRING (200 MS/s)' : 'TRIGGER PAUSED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              MIL-STD-1553B · CAN-FD 5Mbps · SPI 25MHz · eSAD-200 Arming Gate Telemetry
            </p>
          </div>
        </div>

        {/* Timebase & Run Controls */}
        <div className="flex items-center gap-2">
          {/* Timebase Selector */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 text-xs font-mono">
            {(['100ns', '1us', '10us', '100us'] as const).map((tb) => (
              <button
                key={tb}
                onClick={() => {
                  soundFX.click();
                  setTimebase(tb);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                  timebase === tb
                    ? 'bg-cyan-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tb}/div
              </button>
            ))}
          </div>

          {/* Run / Stop Toggle */}
          <button
            onClick={() => {
              soundFX.click();
              setIsRunning(!isRunning);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isRunning
                ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-700 text-amber-300'
                : 'bg-emerald-950/80 hover:bg-emerald-900 border-emerald-700 text-emerald-300'
            }`}
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} />}
            <span>{isRunning ? 'Pause Sweep' : 'Resume Sweep'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Waveform Canvas + Live Protocol Packet Decoder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80">
        {/* LEFT: 4-Channel Oscilloscope Canvas (7 Cols) */}
        <div className="lg:col-span-7 p-4 bg-[#050a14] relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-800/60">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>4-CHANNEL DIGITAL TIMING WAVEFORM</span>
            </span>
            <span>SAMPLE: 200 MSPS · TRIGGER: RISING EDGE @ 1.65V</span>
          </div>

          {/* Canvas Viewport */}
          <div className="relative w-full aspect-[16/9] max-h-[340px] my-2 rounded-xl overflow-hidden border border-slate-800">
            <canvas
              ref={canvasRef}
              width={720}
              height={320}
              className="w-full h-full block"
            />
          </div>

          {/* Channel Selector Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-2">
            {BUS_LOGIC_CHANNELS.map((ch) => {
              const isSelected = activeChannelId === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => {
                    soundFX.click();
                    setActiveChannelId(ch.id);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-mono transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500 text-white font-bold ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: ch.color }}
                    ></span>
                    <span className="truncate">{ch.name.split(':')[0]}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal shrink-0">
                    {ch.protocol.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Protocol Packet Frame Inspector & Fault Injection (5 Cols) */}
        <div className="lg:col-span-5 p-5 space-y-4 bg-slate-950/70 flex flex-col justify-between text-xs">
          <div className="space-y-4">
            {/* Header of Active Channel */}
            <div className="border-b border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: activeChannel.color }}>
                  {activeChannel.name.split(':')[0]} · {activeChannel.protocol}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Jitter: ±{activeChannel.jitterNs} ns
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-1">
                {activeChannel.name.split(':')[1]}
              </h3>
              <p className="text-[11px] font-mono text-emerald-400 mt-1">
                Throughput: {activeChannel.activeRate} · Status: {activeChannel.status}
              </p>
            </div>

            {/* Decoded Frame Inspector Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 font-mono space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <Terminal size={12} />
                  <span>FRAME DECODER</span>
                </span>
                <span>PACKET #{packetCounter.toLocaleString()}</span>
              </div>

              {/* Raw Hex Dump */}
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Raw Hex Payload:</div>
                <div className="text-xs font-bold text-amber-300 tracking-wider bg-slate-950 p-2 rounded-lg border border-slate-800/90 mt-0.5">
                  {injectedFault ? '0xFFFF_ERR_CORRUPT' : activeChannel.currentFrameHex}
                </div>
              </div>

              {/* Decoded Human-Readable Protocol Fields */}
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Decoded Protocol Fields:</div>
                <div className="text-[11px] text-slate-200 bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 mt-0.5 leading-relaxed">
                  {injectedFault ? (
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>{injectedFault}: Lockstep ECC Detected Single-Bit Inversion; Auto-Corrected via Hamming SECDED.</span>
                    </span>
                  ) : (
                    activeChannel.decodedFrame
                  )}
                </div>
              </div>

              {/* CRC and Parity Status */}
              <div className="flex items-center justify-between text-[10px] pt-1 text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <CheckCircle2 size={12} />
                  <span>CRC32 / Manchester Parity: VALID</span>
                </span>
                <span className="text-slate-500">Bit Error Rate: &lt; 10⁻¹²</span>
              </div>
            </div>

            {/* Interactive Fault Injection Section */}
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Zap size={12} className="text-amber-400" />
                <span>Simulate Signal Anomaly &amp; Fault Injection:</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleInjectFault('PARITY_ERR')}
                  className={`px-3 py-2 rounded-xl text-left border transition-all ${
                    injectedFault === 'PARITY_ERR'
                      ? 'bg-rose-950 border-rose-600 text-white font-bold ring-1 ring-rose-500'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-[11px]">1553B Parity Inversion</div>
                  <div className="text-[10px] text-slate-500">Forces Bi-Phase Error</div>
                </button>

                <button
                  onClick={() => handleInjectFault('CAN_STUFFING')}
                  className={`px-3 py-2 rounded-xl text-left border transition-all ${
                    injectedFault === 'CAN_STUFFING'
                      ? 'bg-amber-950 border-amber-600 text-white font-bold ring-1 ring-amber-500'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-[11px]">CAN-FD Bit Stuffing</div>
                  <div className="text-[10px] text-slate-500">Triggers Retransmit</div>
                </button>

                <button
                  onClick={() => handleInjectFault('EMI_NOISE')}
                  className={`px-3 py-2 rounded-xl text-left border transition-all ${
                    injectedFault === 'EMI_NOISE'
                      ? 'bg-purple-950 border-purple-600 text-white font-bold ring-1 ring-purple-500'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-[11px]">High EMI Rail Glitch</div>
                  <div className="text-[10px] text-slate-500">Injects 50mV Ripple</div>
                </button>

                <button
                  onClick={() => handleInjectFault('ESAD_DISARM')}
                  className={`px-3 py-2 rounded-xl text-left border transition-all ${
                    injectedFault === 'ESAD_DISARM'
                      ? 'bg-rose-950 border-rose-600 text-white font-bold ring-1 ring-rose-500'
                      : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-[11px]">eSAD Gate Abort</div>
                  <div className="text-[10px] text-slate-500">Tests Safe Interlock</div>
                </button>
              </div>
            </div>
          </div>

          {/* Failsafe Redundancy Footer */}
          <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Radiation &amp; Lockstep Failsafe:</span>{' '}
            <span>Dual-core lockstep hardware compares each instruction cycle; discrepancy triggers 2µs failover to redundant bus channel.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
