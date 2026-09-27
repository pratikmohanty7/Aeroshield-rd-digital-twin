import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  XCircle,
  Clock,
  HelpCircle,
  RefreshCw,
  Cpu,
} from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
  variant?: 'dot' | 'badge';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className = '',
  showIcon = true,
  variant = 'dot',
}) => {
  const normStatus = (status || '').toUpperCase();

  type StatusCategory = 'nominal' | 'warning' | 'degraded' | 'critical' | 'pending' | 'info';
  let category: StatusCategory = 'info';
  let IconComponent = HelpCircle;

  switch (normStatus) {
    case 'NORMAL':
    case 'OPTIMAL':
    case 'PASSED':
    case 'SIMULATED PASS':
    case 'HEALTHY':
    case 'IMPLEMENTED':
    case 'ACTIVE':
    case 'VERIFIED FACT':
    case 'VERIFIED':
    case 'SURVIVED':
    case 'NOMINAL':
    case 'ARMED':
      category = 'nominal';
      IconComponent = CheckCircle2;
      break;

    case 'WARNING':
    case 'NOTICE':
    case 'RUNNING':
    case 'SIMULATED':
    case 'SIMULATION RESULT':
    case 'ENGINEERING INFERENCE':
    case 'IN_FLIGHT':
    case 'CAUTION':
      category = 'warning';
      IconComponent = AlertTriangle;
      break;

    case 'DEGRADED':
    case 'PROPOSED':
    case 'ASSUMPTION':
    case 'STANDBY':
      category = 'degraded';
      IconComponent = AlertOctagon;
      break;

    case 'FAILED':
    case 'CRITICAL':
    case 'ERROR':
    case 'SIMULATED FAIL':
    case 'DISCONNECTED':
    case 'ISOLATED':
    case 'FAULT':
      category = 'critical';
      IconComponent = XCircle;
      break;

    case 'STALE':
    case 'PENDING':
    case 'PLANNED':
      category = 'pending';
      IconComponent = Clock;
      break;

    case 'RECOVERING':
      category = 'warning';
      IconComponent = RefreshCw;
      break;

    default:
      category = 'info';
      IconComponent = Cpu;
      break;
  }

  // Sober, high-contrast engineering colors (Zero neon halos or AI gradients)
  const dotColorMap: Record<StatusCategory, { dot: string; text: string; bg: string; border: string }> = {
    nominal: {
      dot: 'bg-emerald-500',
      text: 'text-emerald-400',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/50',
    },
    warning: {
      dot: 'bg-amber-500',
      text: 'text-amber-400',
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/50',
    },
    degraded: {
      dot: 'bg-orange-500',
      text: 'text-orange-400',
      bg: 'bg-orange-950/40',
      border: 'border-orange-700/50',
    },
    critical: {
      dot: 'bg-rose-500',
      text: 'text-rose-400',
      bg: 'bg-rose-950/40',
      border: 'border-rose-700/50',
    },
    pending: {
      dot: 'bg-slate-400',
      text: 'text-slate-300',
      bg: 'bg-slate-900/60',
      border: 'border-slate-700/50',
    },
    info: {
      dot: 'bg-sky-400',
      text: 'text-sky-300',
      bg: 'bg-sky-950/40',
      border: 'border-sky-800/50',
    },
  };

  const style = dotColorMap[category];

  const sizeClasses =
    size === 'sm'
      ? 'text-[10px] gap-1.5'
      : size === 'lg'
      ? 'text-xs gap-2'
      : 'text-[11px] gap-1.5';

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5';

  if (variant === 'badge') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-sm border font-mono font-medium tracking-wide uppercase transition-colors ${sizeClasses} ${style.bg} ${style.border} ${style.text} ${className}`}
      >
        {showIcon && <IconComponent size={size === 'sm' ? 11 : 12} className="shrink-0" />}
        <span className="whitespace-nowrap">{status}</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-mono font-medium tracking-wide uppercase transition-colors ${sizeClasses} ${style.text} ${className}`}
      title={`Status: ${status}`}
    >
      {showIcon && (
        <span className="relative flex shrink-0 items-center justify-center">
          <span className={`inline-block rounded-full ${dotSize} ${style.dot}`} />
        </span>
      )}
      <span className="whitespace-nowrap">{status}</span>
    </span>
  );
};
