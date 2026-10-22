export class RateLimiter {
  private hits = new Map<string, number[]>();

  allow(id: string, now: number, windowMs = 10_000, max = 40): boolean {
    const recent = (this.hits.get(id) ?? []).filter((stamp) => now - stamp < windowMs);
    if (recent.length >= max) {
      this.hits.set(id, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(id, recent);
    return true;
  }
}
