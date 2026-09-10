export class RateLimitError extends Error {
  public readonly retryAt: number;

  public constructor(retryAfter: string | null) {
    const now = Date.now();
    const indicated = retryAfter && /^\d+$/.test(retryAfter)
      ? now + Number(retryAfter) * 1000
      : retryAfter ? Date.parse(retryAfter) : NaN;
    const retryAt = Number.isFinite(indicated) ? Math.max(now, indicated) : now + 1000;
    const seconds = Math.ceil((retryAt - now) / 1000);
    super(`You've reached a temporary request limit. Retry in ${seconds} ${seconds === 1 ? "second" : "seconds"}.`);
    this.retryAt = retryAt;
  }
}
