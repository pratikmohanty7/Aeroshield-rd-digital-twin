export function formatNumber(val: number, decimals: number = 2): string {
  if (isNaN(val)) return '--';
  return val.toFixed(decimals);
}

export function formatPercent(val: number): string {
  if (isNaN(val)) return '--%';
  return `${Math.min(100, Math.max(0, Math.round(val)))}%`;
}

export function formatTimestamp(ms: number): string {
  if (!ms || ms <= 0) return '--:--:--';
  const d = new Date(ms);
  return d.toTimeString().split(' ')[0] + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

export function formatElapsedSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${tenths}`;
}

export function formatLatency(latencyMs: number | undefined): string {
  if (latencyMs === undefined || isNaN(latencyMs)) return 'N/A';
  return `${latencyMs.toFixed(1)} ms`;
}
