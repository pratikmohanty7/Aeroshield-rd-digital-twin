import React, { useState, useEffect } from 'react';
import {
  Activity,
  Zap,
  Gauge,
  Shield,
  Radio,
  Cpu,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';

interface CircularGaugeProps {
  value: number;
  label: string;
  unit: string;
  color?: string;
  max?: number;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  label,
  unit,
  color = '#38bdf8',
  max = 100,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = 100 - percentage;

  return (
    <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-[#090e1a]/80 border border-white/[0.06]">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <path
            className="text-slate-800"
            strokeWidth="3.2"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          {/* Active progress arc */}
          <path
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="3.2"
            stroke={color}
            strokeLinecap="round"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-white font-mono leading-none">
            {value}
          </span>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">{unit}</span>
        </div>
      </div>
      <span className="text-[10px] text-slate-400 font-mono font-medium mt-1.5 text-center leading-tight truncate w-full">
        {label}
      </span>
    </div>
  );
};

export const DigitalTwinOperatorHUD: React.FC = () => {
  // Live simulated telemetry stream for charts
  const [points, setPoints] = useState<number[]>([
    45, 52, 48, 65, 58, 72, 68, 85, 78, 92, 86, 95, 88, 91, 84, 89, 94, 98,
  ]);
  const [diagnosticsWave, setDiagnosticsWave] = useState<number[]>([
    30, 42, 38, 55, 48, 62, 70, 65, 58, 72, 80, 75, 82, 88, 84, 79, 86, 90,
  ]);

  // Periodic tick for live graphs
  useEffect(() => {
    const timer = setInterval(() => {
      setPoints((prev) => {
        const nextVal = Math.min(99, Math.max(65, prev[prev.length - 1] + (Math.random() * 8 - 4)));
        return [...prev.slice(1), parseFloat(nextVal.toFixed(1))];
      });
      setDiagnosticsWave((prev) => {
        const nextVal = Math.min(95, Math.max(50, prev[prev.length - 1] + (Math.random() * 10 - 5)));
        return [...prev.slice(1), parseFloat(nextVal.toFixed(1))];
      });
    }, 1200);

    return () => clearInterval(timer);
  }, []);

  // Generate SVG path for line chart
  const getPolylinePoints = (data: number[], width = 280, height = 70) => {
    const step = width / (data.length - 1);
    return data
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (val / 100) * height * 0.85 - 5;
        return `${x},${y}`;
      })
      .join(' ');
  };

  const defectBars = [
    { label: 'CH1', height: 42, color: '#38bdf8' },
    { label: 'CH2', height: 68, color: '#10b981' },
    { label: 'CH3', height: 55, color: '#38bdf8' },
    { label: 'CH4', height: 85, color: '#10b981' },
    { label: 'CH5', height: 35, color: '#38bdf8' },
    { label: 'CH6', height: 72, color: '#10b981' },
    { label: 'CH7', height: 90, color: '#f59e0b' },
    { label: 'CH8', height: 48, color: '#38bdf8' },
    { label: 'CH9', height: 60, color: '#10b981' },
    { label: 'C10', height: 78, color: '#38bdf8' },
    { label: 'C11', height: 64, color: '#10b981' },
    { label: 'C12', height: 92, color: '#10b981' },
  ];

  return null; // Used as modular exported components below
};
