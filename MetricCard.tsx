import React from 'react';
import { StatusBadge } from './StatusBadge';
import { HelpCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: string;
  definition?: string;
  subtext?: string;
  causes?: string[];
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  status,
  definition,
  subtext,
  causes,
  className = '',
}) => {
  return (
    <div
      className={`bg-[#0d1322] border border-white/[0.08] hover:border-white/[0.16] rounded-sm p-3.5 flex flex-col justify-between transition-colors font-sans ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
            {label}
          </span>
          {definition && (
            <span
              className="text-slate-500 hover:text-slate-300 cursor-help transition-colors"
              title={definition}
            >
              <HelpCircle size={12} />
            </span>
          )}
        </div>
        {status && <StatusBadge status={status} size="sm" />}
      </div>

      <div className="my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tracking-tight font-mono tabular-nums">
            {value}
          </span>
          {unit && <span className="text-xs text-slate-400 font-mono">{unit}</span>}
        </div>
        {subtext && <p className="text-[11px] text-slate-400 mt-1 leading-snug">{subtext}</p>}
      </div>

      {causes && causes.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/[0.06] text-[11px] text-amber-300/90 space-y-0.5">
          <span className="text-slate-500 uppercase font-mono font-semibold text-[10px]">Contributing factors:</span>
          {causes.slice(0, 2).map((c, i) => (
            <p key={i} className="truncate text-slate-300">
              • {c}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
