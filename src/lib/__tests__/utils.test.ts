import { describe, it, expect, vi, afterEach } from "vitest";
import { formatRupiah, generateNoTransaksi, formatDate } from "../utils";

afterEach(() => {
  vi.useRealTimers();
});

// ── formatRupiah ─────────────────────────────────────
describe("formatRupiah", () => {
  it("formats zero", () => {
    expect(formatRupiah(0)).toMatch(/Rp\s?0/);
  });

  it("formats small amount", () => {
    expect(formatRupiah(18000)).toMatch(/Rp\s?18\.000/);
  });

  it("formats large amount", () => {
    expect(formatRupiah(1500000)).toMatch(/Rp\s?1\.500\.000/);
  });

  it("uses IDR currency format", () => {
    const result = formatRupiah(10000);
    expect(result).toMatch(/^Rp/);
  });

  it("contains no decimal cents", () => {
    const result = formatRupiah(12345);
    // Should not have decimal point for cents (e.g. 12345.00)
    const parts = result.split(",");
    expect(parts).toHaveLength(1);
  });
});

// ── generateNoTransaksi ──────────────────────────────
describe("generateNoTransaksi", () => {
  it("returns INV- prefix", () => {
    expect(generateNoTransaksi()).toMatch(/^INV-/);
  });

  it("returns format INV-YYMMDDHHMMSS-RAND", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 21, 14, 30, 45)); // Jul 21, 2026 14:30:45

    const result = generateNoTransaksi();
    expect(result).toMatch(/^INV-260721143045-\d{3}$/);
  });

  it("generates unique values", () => {
    const values = new Set(Array.from({ length: 100 }, () => generateNoTransaksi()));
    // With random suffix, extremely unlikely to collide
    expect(values.size).toBeGreaterThan(90);
  });

  it("random part is 3 digits", () => {
    const result = generateNoTransaksi();
    const randPart = result.split("-")[2];
    expect(randPart).toHaveLength(3);
    expect(Number(randPart)).toBeGreaterThanOrEqual(0);
    expect(Number(randPart)).toBeLessThanOrEqual(999);
  });
});

// ── formatDate ───────────────────────────────────────
describe("formatDate", () => {
  it("formats a date to Indonesian locale string", () => {
    const date = new Date(2026, 6, 21, 14, 30);
    const result = formatDate(date);
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("returns same output for same input", () => {
    const date = new Date(2026, 0, 1, 8, 0);
    expect(formatDate(date)).toBe(formatDate(date));
  });

  it("handles different dates", () => {
    const date1 = new Date(2026, 0, 1);
    const date2 = new Date(2026, 11, 31);
    expect(formatDate(date1)).not.toBe(formatDate(date2));
  });
});
