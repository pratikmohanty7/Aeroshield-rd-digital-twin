import React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, X, ChevronRight } from 'lucide-react';
import { soundFX } from '../../utils/audioFeedback';

export const DemoBanner: React.FC = () => {
  const { demoRunning, demoStep, demoMessage, stopDemo } = useApp();

  if (!demoRunning) return null;

  const totalSteps = 16;
  const progressPercent = Math.min(100, Math.round((demoStep / totalSteps) * 100));

  return (
    <div className="bg-[#090e1a] border-b border-cyan-500/40 px-4 sm:px-6 py-2 text-slate-100 font-sans shadow-lg select-none">
      <div className="max-w-[1780px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6 rounded-sm bg-cyan-500/15 border border-cyan-500/40 text-cyan-400 shrink-0">
            <Compass size={13} className="animate-spin" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-white font-sans">
                Automated Mission Tour
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Phase {demoStep}/{totalSteps} ({progressPercent}%)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-normal flex items-center gap-1.5 font-mono">
              <ChevronRight size={12} className="text-cyan-400 shrink-0" />
              <span>{demoMessage}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="w-32 bg-[#050811] border border-white/[0.08] h-1.5 overflow-hidden rounded-xs">
            <div
              className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <button
            onClick={() => {
              soundFX.click();
              stopDemo();
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-sm bg-[#0d1322] hover:bg-[#152238] text-slate-300 border border-white/[0.08] transition-colors font-mono"
          >
            <X size={11} />
            <span>End Tour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
