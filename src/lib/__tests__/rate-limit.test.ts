import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "../rate-limit";

beforeEach(() => {
  vi.useFakeTimers();
  vi.restoreAllMocks();
});

describe("checkRateLimit", () => {
  it("allows first request", () => {
    const result = checkRateLimit("test-key", { max: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("tracks remaining count correctly", () => {
    const key = "track-key";
    checkRateLimit(key, { max: 3 });
    const second = checkRateLimit(key, { max: 3 });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks when limit is reached", () => {
    const key = "block-key";
    checkRateLimit(key, { max: 2 });
    checkRateLimit(key, { max: 2 });
    const third = checkRateLimit(key, { max: 2 });
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it("allows again after window expires", () => {
    const key = "expire-key";
    const windowMs = 1000;

    checkRateLimit(key, { max: 1, windowMs });
    const second = checkRateLimit(key, { max: 1, windowMs });
    expect(second.allowed).toBe(false);

    vi.advanceTimersByTime(windowMs + 1);

    const after = checkRateLimit(key, { max: 1, windowMs });
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it("uses separate counters per key", () => {
    const config = { max: 1 };
    checkRateLimit("key-a", config);
    const a = checkRateLimit("key-a", config);
    const b = checkRateLimit("key-b", config);
    expect(a.allowed).toBe(false);
    expect(b.allowed).toBe(true);
  });

  it("returns correct resetAt timestamp", () => {
    const now = Date.now();
    const windowMs = 5000;
    const result = checkRateLimit("reset-key", { max: 5, windowMs });
    expect(result.resetAt).toBeGreaterThanOrEqual(now + windowMs);
    expect(result.resetAt).toBeLessThanOrEqual(now + windowMs + 50);
  });

  it("defaults windowMs to 15 minutes", () => {
    const now = Date.now();
    const result = checkRateLimit("default-window", { max: 10 });
    expect(result.resetAt).toBeGreaterThanOrEqual(now + 15 * 60 * 1000);
    expect(result.resetAt).toBeLessThanOrEqual(now + 15 * 60 * 1000 + 50);
  });

  it("handles rapid requests correctly", () => {
    const key = "rapid-key";
    const results = Array.from({ length: 5 }, (_, i) =>
      checkRateLimit(key, { max: 3 })
    );

    expect(results[0].allowed).toBe(true);
    expect(results[1].allowed).toBe(true);
    expect(results[2].allowed).toBe(true);
    expect(results[3].allowed).toBe(false);
    expect(results[4].allowed).toBe(false);
  });
});
