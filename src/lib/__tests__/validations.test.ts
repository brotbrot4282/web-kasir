import { describe, it, expect } from "vitest";
import {
  loginSchema,
  transaksiSchema,
  menuCreateSchema,
  menuUpdateSchema,
  kategoriSchema,
  stokCreateSchema,
  stokUpdateSchema,
  poinDeductSchema,
  pengaturanPoinSchema,
  openingSchema,
  closingSchema,
} from "../validations";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

// ── loginSchema ──────────────────────────────────────
describe("loginSchema", () => {
  it("accepts valid input", () => {
    const result = loginSchema.safeParse({ username: "admin", password: "123" });
    expect(result.success).toBe(true);
  });

  it("rejects empty username", () => {
    const result = loginSchema.safeParse({ username: "", password: "123" });
    expect(result.success).toBe(false);
  });

  it("rejects missing password", () => {
    const result = loginSchema.safeParse({ username: "admin" });
    expect(result.success).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(loginSchema.safeParse({ username: 123, password: true }).success).toBe(false);
  });
});

// ── transaksiSchema ──────────────────────────────────
describe("transaksiSchema", () => {
  const valid = {
    items: [{ menuId: UUID, jumlah: 2 }],
    totalBayar: 25000,
    metodeBayar: "CASH" as const,
  };

  it("accepts valid transaksi", () => {
    expect(transaksiSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults diskon to 0", () => {
    const result = transaksiSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.diskon).toBe(0);
  });

  it("rejects empty items array", () => {
    expect(transaksiSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it("rejects invalid metodeBayar", () => {
    expect(transaksiSchema.safeParse({ ...valid, metodeBayar: "TRANSFER" }).success).toBe(false);
  });

  it("accepts QRIS payment", () => {
    expect(transaksiSchema.safeParse({ ...valid, metodeBayar: "QRIS" }).success).toBe(true);
  });

  it("rejects negative totalBayar", () => {
    expect(transaksiSchema.safeParse({ ...valid, totalBayar: -100 }).success).toBe(false);
  });

  it("rejects non-uuid menuId", () => {
    expect(
      transaksiSchema.safeParse({
        ...valid,
        items: [{ menuId: "not-a-uuid", jumlah: 1 }],
      }).success
    ).toBe(false);
  });

  it("rejects zero jumlah", () => {
    expect(
      transaksiSchema.safeParse({
        ...valid,
        items: [{ menuId: UUID, jumlah: 0 }],
      }).success
    ).toBe(false);
  });

  it("accepts optional variant and gratisPoin", () => {
    expect(
      transaksiSchema.safeParse({
        ...valid,
        items: [{ menuId: UUID, jumlah: 1, variant: "Panas | Gula Sedang", gratisPoin: true }],
      }).success
    ).toBe(true);
  });

  it("rejects negative diskon", () => {
    expect(transaksiSchema.safeParse({ ...valid, diskon: -500 }).success).toBe(false);
  });
});

// ── menuCreateSchema ─────────────────────────────────
describe("menuCreateSchema", () => {
  const valid = {
    nama: "Kopi Susu",
    harga: 18000,
    kategoriId: UUID,
  };

  it("accepts valid menu", () => {
    expect(menuCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("defaults stok to 0", () => {
    const result = menuCreateSchema.safeParse(valid);
    if (result.success) expect(result.data.stok).toBe(0);
  });

  it("rejects empty nama", () => {
    expect(menuCreateSchema.safeParse({ ...valid, nama: "" }).success).toBe(false);
  });

  it("rejects negative harga", () => {
    expect(menuCreateSchema.safeParse({ ...valid, harga: -5000 }).success).toBe(false);
  });

  it("rejects invalid kategoriId", () => {
    expect(menuCreateSchema.safeParse({ ...valid, kategoriId: "bad" }).success).toBe(false);
  });

  it("rejects float harga", () => {
    expect(menuCreateSchema.safeParse({ ...valid, harga: 18000.5 }).success).toBe(false);
  });
});

// ── menuUpdateSchema ─────────────────────────────────
describe("menuUpdateSchema", () => {
  it("accepts empty body (all fields optional)", () => {
    expect(menuUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    expect(menuUpdateSchema.safeParse({ nama: "Kopi" }).success).toBe(true);
  });

  it("rejects invalid type for harga", () => {
    expect(menuUpdateSchema.safeParse({ harga: "abc" }).success).toBe(false);
  });

  it("rejects negative stok", () => {
    expect(menuUpdateSchema.safeParse({ stok: -1 }).success).toBe(false);
  });
});

// ── kategoriSchema ───────────────────────────────────
describe("kategoriSchema", () => {
  it("accepts valid nama", () => {
    expect(kategoriSchema.safeParse({ nama: "Kopi" }).success).toBe(true);
  });

  it("rejects empty nama", () => {
    expect(kategoriSchema.safeParse({ nama: "" }).success).toBe(false);
  });

  it("rejects nama > 50 chars", () => {
    expect(kategoriSchema.safeParse({ nama: "a".repeat(51) }).success).toBe(false);
  });

  it("accepts nama at exactly 50 chars", () => {
    expect(kategoriSchema.safeParse({ nama: "a".repeat(50) }).success).toBe(true);
  });
});

// ── stokCreateSchema ─────────────────────────────────
describe("stokCreateSchema", () => {
  const valid = { namaBahan: "Gula", jumlah: 10, satuan: "kg" };

  it("accepts valid stok", () => {
    expect(stokCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty namaBahan", () => {
    expect(stokCreateSchema.safeParse({ ...valid, namaBahan: "" }).success).toBe(false);
  });

  it("rejects zero jumlah", () => {
    expect(stokCreateSchema.safeParse({ ...valid, jumlah: 0 }).success).toBe(false);
  });

  it("rejects empty satuan", () => {
    expect(stokCreateSchema.safeParse({ ...valid, satuan: "" }).success).toBe(false);
  });
});

// ── stokUpdateSchema ─────────────────────────────────
describe("stokUpdateSchema", () => {
  it("accepts empty body", () => {
    expect(stokUpdateSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial update", () => {
    expect(stokUpdateSchema.safeParse({ jumlah: 50 }).success).toBe(true);
  });

  it("rejects negative jumlah", () => {
    expect(stokUpdateSchema.safeParse({ jumlah: -5 }).success).toBe(false);
  });
});

// ── poinDeductSchema ─────────────────────────────────
describe("poinDeductSchema", () => {
  it("accepts valid input", () => {
    expect(poinDeductSchema.safeParse({ poin: 5, keterangan: "Tukar kopi" }).success).toBe(true);
  });

  it("rejects zero poin", () => {
    expect(poinDeductSchema.safeParse({ poin: 0, keterangan: "test" }).success).toBe(false);
  });

  it("rejects empty keterangan", () => {
    expect(poinDeductSchema.safeParse({ poin: 5, keterangan: "" }).success).toBe(false);
  });
});

// ── pengaturanPoinSchema ─────────────────────────────
describe("pengaturanPoinSchema", () => {
  it("accepts valid values", () => {
    expect(
      pengaturanPoinSchema.safeParse({ rupiahPerPoin: 15000, poinPerGratisItem: 5, minimalTransaksi: 10000 }).success
    ).toBe(true);
  });

  it("accepts zero minimalTransaksi (no limit)", () => {
    expect(
      pengaturanPoinSchema.safeParse({ rupiahPerPoin: 15000, poinPerGratisItem: 5, minimalTransaksi: 0 }).success
    ).toBe(true);
  });

  it("rejects zero rupiahPerPoin", () => {
    expect(
      pengaturanPoinSchema.safeParse({ rupiahPerPoin: 0, poinPerGratisItem: 5, minimalTransaksi: 10000 }).success
    ).toBe(false);
  });

  it("rejects negative poinPerGratisItem", () => {
    expect(
      pengaturanPoinSchema.safeParse({ rupiahPerPoin: 15000, poinPerGratisItem: -1, minimalTransaksi: 10000 }).success
    ).toBe(false);
  });
});

// ── openingSchema ────────────────────────────────────
describe("openingSchema", () => {
  it("accepts valid uangAwal", () => {
    expect(openingSchema.safeParse({ uangAwal: 200000 }).success).toBe(true);
  });

  it("accepts zero uangAwal", () => {
    expect(openingSchema.safeParse({ uangAwal: 0 }).success).toBe(true);
  });

  it("rejects negative uangAwal", () => {
    expect(openingSchema.safeParse({ uangAwal: -100000 }).success).toBe(false);
  });

  it("rejects float uangAwal", () => {
    expect(openingSchema.safeParse({ uangAwal: 1500.5 }).success).toBe(false);
  });
});

// ── closingSchema ────────────────────────────────────
describe("closingSchema", () => {
  it("accepts empty body", () => {
    expect(closingSchema.safeParse({}).success).toBe(true);
  });

  it("accepts valid catatan", () => {
    expect(closingSchema.safeParse({ catatan: "Hari ramai" }).success).toBe(true);
  });

  it("accepts valid belanjaUrgent", () => {
    expect(
      closingSchema.safeParse({
        belanjaUrgent: [{ nama: "Gula", jumlah: 5, satuan: "kg" }],
      }).success
    ).toBe(true);
  });

  it("rejects invalid belanjaUrgent item", () => {
    expect(
      closingSchema.safeParse({
        belanjaUrgent: [{ nama: "", jumlah: 5, satuan: "kg" }],
      }).success
    ).toBe(false);
  });

  it("rejects catatan > 500 chars", () => {
    expect(closingSchema.safeParse({ catatan: "a".repeat(501) }).success).toBe(false);
  });
});
