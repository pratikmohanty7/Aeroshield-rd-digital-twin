import React from 'react';
import { Database } from 'lucide-react';

interface DataSourceBadgeProps {
  source?: string;
  className?: string;
}

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source = 'SIMULATED 200 Hz REFERENCE STREAM',
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-400 tracking-tight ${className}`}
      title="Hardware-in-the-loop simulation stream provenance"
    >
      <Database size={11} className="text-cyan-400/80 shrink-0" />
      <span className="text-slate-400">{source}</span>
    </span>
  );
};
