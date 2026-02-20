export class RateLimiter {
  private lastCallTime = 0;

  constructor(private delayMs: number) {}

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.delayMs) {
      await sleep(this.delayMs - elapsed);
    }
    this.lastCallTime = Date.now();
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const youtubeApiLimiter = new RateLimiter(200);
export const transcriptLimiter = new RateLimiter(2000);
