/** Parses TTL strings like "15m", "7d", "12h", "30s" into milliseconds. */
export function ttlToMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) {
    throw new Error(`Invalid TTL format: "${ttl}" (expected e.g. 15m, 7d)`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const factors: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return value * factors[unit];
}
