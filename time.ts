export function getSimulationEpoch(baseEpoch: number, elapsedSimulationSeconds: number): number {
  return baseEpoch + elapsedSimulationSeconds * 1000;
}

export function generateSimpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'EV-' + Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
}
