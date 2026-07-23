import { describe, it, expect } from "vitest";
import { hitungHPP, toBaseUnit, convertToStokUnit, getAvailableUnits } from "../hpp";

describe("hitungHPP", () => {
  it("menghitung HPP dari satu bahan", () => {
    const resep = [{ jumlah: 0.018, stok: { hargaBahan: 120, satuan: "kg" } }];
    expect(hitungHPP(resep)).toBeCloseTo(2.16);
  });

  it("menghitung HPP dari multiple bahan", () => {
    const resep = [
      { jumlah: 0.018, stok: { hargaBahan: 120, satuan: "kg" } },
      { jumlah: 200, stok: { hargaBahan: 2, satuan: "ml" } },
    ];
    expect(hitungHPP(resep)).toBeCloseTo(402.16);
  });

  it("return 0 jika resep kosong", () => {
    expect(hitungHPP([])).toBe(0);
  });

  it("handle hargaBahan 0 (gratis)", () => {
    const resep = [
      { jumlah: 200, stok: { hargaBahan: 0, satuan: "ml" } },
      { jumlah: 0.018, stok: { hargaBahan: 120, satuan: "kg" } },
    ];
    expect(hitungHPP(resep)).toBeCloseTo(2.16);
  });
});

describe("toBaseUnit", () => {
  it("converts kg to gram", () => {
    expect(toBaseUnit(1, "kg")).toEqual({ jumlah: 1000, satuan: "gram" });
  });

  it("converts liter to ml", () => {
    expect(toBaseUnit(1, "liter")).toEqual({ jumlah: 1000, satuan: "ml" });
  });

  it("kecilkan kg ke gram (0.018 kg = 18 gram)", () => {
    expect(toBaseUnit(0.018, "kg")).toEqual({ jumlah: 18, satuan: "gram" });
  });

  it("gram tetap gram", () => {
    expect(toBaseUnit(100, "gram")).toEqual({ jumlah: 100, satuan: "gram" });
  });

  it("ml tetap ml", () => {
    expect(toBaseUnit(200, "ml")).toEqual({ jumlah: 200, satuan: "ml" });
  });

  it("pcs tetap pcs", () => {
    expect(toBaseUnit(5, "pcs")).toEqual({ jumlah: 5, satuan: "pcs" });
  });

  it("bungkus converts to pcs", () => {
    expect(toBaseUnit(3, "bungkus")).toEqual({ jumlah: 3, satuan: "pcs" });
  });

  it("pack converts to pcs", () => {
    expect(toBaseUnit(2, "pack")).toEqual({ jumlah: 2, satuan: "pcs" });
  });

  it("handle unknown satuan", () => {
    expect(toBaseUnit(10, "box")).toEqual({ jumlah: 10, satuan: "box" });
  });
});

describe("convertToStokUnit", () => {
  it("same unit returns same value", () => {
    expect(convertToStokUnit(100, "gram", "gram")).toBe(100);
  });

  it("converts gram to kg", () => {
    expect(convertToStokUnit(180, "gram", "kg")).toBeCloseTo(0.18);
  });

  it("converts ml to liter", () => {
    expect(convertToStokUnit(500, "ml", "liter")).toBeCloseTo(0.5);
  });

  it("kg to kg stays same", () => {
    expect(convertToStokUnit(2, "kg", "kg")).toBe(2);
  });

  it("handles unknown satuan gracefully", () => {
    expect(convertToStokUnit(10, "box", "pcs")).toBe(10);
  });
});

describe("getAvailableUnits", () => {
  it("kg returns kg and gram", () => {
    expect(getAvailableUnits("kg")).toEqual(["kg", "gram"]);
  });

  it("liter returns liter and ml", () => {
    expect(getAvailableUnits("liter")).toEqual(["liter", "ml"]);
  });

  it("gram returns gram and kg", () => {
    expect(getAvailableUnits("gram")).toEqual(["gram", "kg"]);
  });

  it("ml returns ml and liter", () => {
    expect(getAvailableUnits("ml")).toEqual(["ml", "liter"]);
  });

  it("pcs returns pcs, bungkus, pack", () => {
    expect(getAvailableUnits("pcs")).toEqual(["pcs", "bungkus", "pack"]);
  });
});
