import { describe, it, expect } from "vitest";
import { wibParts, getIsoWeek, buildGrafikData } from "../grafik";

const wib = (year: number, month: number, day: number, hour: number, min = 0) =>
  new Date(Date.UTC(year, month - 1, day, hour - 7, min));

describe("wibParts", () => {
  it("converts UTC to WIB (10:30 UTC = 17:30 WIB)", () => {
    const d = new Date(Date.UTC(2026, 4, 12, 10, 30));
    expect(wibParts(d)).toEqual({ year: 2026, month: 5, day: 12, hour: 17 });
  });

  it("rolls over midnight correctly (16:00 UTC = 23:00 WIB same day)", () => {
    const d = new Date(Date.UTC(2026, 4, 12, 16, 0));
    expect(wibParts(d)).toEqual({ year: 2026, month: 5, day: 12, hour: 23 });
  });

  it("rolls over to next day after 23:59 WIB", () => {
    const d = new Date(Date.UTC(2026, 4, 12, 17, 0));
    expect(wibParts(d)).toEqual({ year: 2026, month: 5, day: 13, hour: 0 });
  });
});

describe("getIsoWeek", () => {
  it("returns ISO week for a Monday", () => {
    expect(getIsoWeek(wib(2026, 5, 4, 12))).toEqual({ year: 2026, week: 19 });
  });

  it("returns ISO week for a Sunday (same week as Monday)", () => {
    expect(getIsoWeek(wib(2026, 5, 10, 12))).toEqual({ year: 2026, week: 19 });
  });
});

describe("buildGrafikData", () => {
  it("JAM: fills 24 hourly buckets and sums across range", () => {
    const tx = [
      { createdAt: wib(2026, 5, 12, 8, 0), totalHarga: 20000 },
      { createdAt: wib(2026, 5, 12, 8, 30), totalHarga: 15000 },
      { createdAt: wib(2026, 5, 12, 17, 0), totalHarga: 50000 },
      { createdAt: wib(2026, 5, 13, 8, 0), totalHarga: 10000 },
    ];
    const result = buildGrafikData(tx, "JAM", wib(2026, 5, 12, 0), wib(2026, 5, 13, 23));
    expect(result).toHaveLength(24);
    expect(result[8]).toEqual({ label: "08:00", tanggal: "08", omset: 45000, transaksi: 3 });
    expect(result[17]).toEqual({ label: "17:00", tanggal: "17", omset: 50000, transaksi: 1 });
    expect(result[0]).toEqual({ label: "00:00", tanggal: "00", omset: 0, transaksi: 0 });
  });

  it("HARI: fills every day between range including zeros", () => {
    const tx = [
      { createdAt: wib(2026, 5, 12, 9, 0), totalHarga: 30000 },
      { createdAt: wib(2026, 5, 14, 9, 0), totalHarga: 45000 },
    ];
    const result = buildGrafikData(tx, "HARI", wib(2026, 5, 12, 0), wib(2026, 5, 14, 23));
    expect(result.map((r) => r.tanggal)).toEqual(["2026-05-12", "2026-05-13", "2026-05-14"]);
    expect(result[0].omset).toBe(30000);
    expect(result[1]).toMatchObject({ omset: 0, transaksi: 0 });
    expect(result[2].omset).toBe(45000);
  });

  it("HARI: derives range from data when dari/sampai omitted", () => {
    const tx = [
      { createdAt: wib(2026, 5, 12, 9, 0), totalHarga: 30000 },
      { createdAt: wib(2026, 5, 14, 9, 0), totalHarga: 45000 },
    ];
    const result = buildGrafikData(tx, "HARI");
    expect(result.map((r) => r.tanggal)).toEqual(["2026-05-12", "2026-05-13", "2026-05-14"]);
  });

  it("MINGGU: groups by ISO week", () => {
    const tx = [
      { createdAt: wib(2026, 5, 4, 9, 0), totalHarga: 20000 },
      { createdAt: wib(2026, 5, 10, 9, 0), totalHarga: 30000 },
      { createdAt: wib(2026, 5, 11, 9, 0), totalHarga: 50000 },
    ];
    const result = buildGrafikData(tx, "MINGGU", wib(2026, 5, 1, 0), wib(2026, 5, 31, 23));
    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({ omset: 0, transaksi: 0 });
    expect(result[1].omset).toBe(50000);
    expect(result[1].transaksi).toBe(2);
    expect(result[2].omset).toBe(50000);
    expect(result[2].transaksi).toBe(1);
  });

  it("BULAN: fills every month between range", () => {
    const tx = [
      { createdAt: wib(2026, 1, 15, 9, 0), totalHarga: 10000 },
      { createdAt: wib(2026, 3, 15, 9, 0), totalHarga: 25000 },
    ];
    const result = buildGrafikData(tx, "BULAN", wib(2026, 1, 1, 0), wib(2026, 3, 31, 23));
    expect(result.map((r) => r.tanggal)).toEqual(["2026-01", "2026-02", "2026-03"]);
    expect(result[0].omset).toBe(10000);
    expect(result[1]).toMatchObject({ omset: 0, transaksi: 0 });
    expect(result[2].omset).toBe(25000);
  });

  it("returns empty array when no transactions and no range", () => {
    expect(buildGrafikData([], "BULAN")).toEqual([]);
  });
});
