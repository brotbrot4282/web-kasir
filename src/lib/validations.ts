import { z } from "zod";

// ── Auth ──────────────────────────────────────────────
export const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi"),
  password: z.string().min(1, "Password wajib diisi"),
});

// ── Transaksi ─────────────────────────────────────────
export const transaksiItemSchema = z.object({
  menuId: z.string().uuid("Menu ID tidak valid"),
  jumlah: z.number().int().positive("Jumlah harus lebih dari 0"),
  variant: z.string().nullish(),
  gratisPoin: z.boolean().optional(),
});

export const transaksiSchema = z.object({
  items: z.array(transaksiItemSchema).min(1, "Minimal satu item diperlukan"),
  totalBayar: z.number().min(0, "Total bayar tidak valid"),
  noWa: z.string().nullish(),
  memberNama: z.string().nullish(),
  diskon: z.number().min(0, "Diskon tidak boleh negatif").default(0),
  metodeBayar: z.enum(["CASH", "QRIS"], {
    message: "Metode bayar harus CASH atau QRIS",
  }),
});

// ── Menu ──────────────────────────────────────────────
export const menuCreateSchema = z.object({
  nama: z.string().min(1, "Nama menu wajib diisi").max(100),
  harga: z.number().int().positive("Harga harus positif"),
  kategoriId: z.string().uuid("Kategori ID tidak valid"),
  gambar: z.string().url().nullish(),
  stok: z.number().int().min(0, "Stok tidak boleh negatif").default(0),
  variants: z.unknown().optional(),
});

export const menuUpdateSchema = z.object({
  nama: z.string().min(1).max(100).optional(),
  harga: z.number().int().positive().optional(),
  kategoriId: z.string().uuid().optional(),
  gambar: z.string().nullish(),
  stok: z.number().int().min(0).optional(),
  isTersedia: z.boolean().optional(),
  variants: z.unknown().optional(),
});

// ── Kategori ──────────────────────────────────────────
export const kategoriSchema = z.object({
  nama: z.string().min(1, "Nama kategori wajib diisi").max(50),
});

// ── Stok ──────────────────────────────────────────────
export const stokCreateSchema = z.object({
  namaBahan: z.string().min(1, "Nama bahan wajib diisi").max(100),
  jumlah: z.number().int().positive("Jumlah harus positif"),
  satuan: z.string().min(1, "Satuan wajib diisi").max(20),
});

export const stokUpdateSchema = z.object({
  namaBahan: z.string().min(1).max(100).optional(),
  jumlah: z.number().int().min(0).optional(),
  satuan: z.string().min(1).max(20).optional(),
});

// ── Member Poin ───────────────────────────────────────
export const poinDeductSchema = z.object({
  poin: z.number().int().positive("Jumlah poin harus positif"),
  keterangan: z.string().min(1, "Keterangan wajib diisi").max(200),
});

// ── Pengaturan Poin ───────────────────────────────────
export const pengaturanPoinSchema = z.object({
  rupiahPerPoin: z.number().int().positive("Rupiah per poin harus positif"),
  poinPerGratisItem: z.number().int().positive("Poin per gratis item harus positif"),
  minimalTransaksi: z.number().int().min(0, "Minimal transaksi harus non-negatif"),
});

// ── Opening / Closing ─────────────────────────────────
export const openingSchema = z.object({
  uangAwal: z.number().int().min(0, "Uang awal harus non-negatif"),
});

export const closingSchema = z.object({
  catatan: z.string().max(500).nullish(),
  belanjaUrgent: z
    .array(
      z.object({
        nama: z.string().min(1),
        jumlah: z.number().int().positive(),
        satuan: z.string().min(1),
      })
    )
    .nullish(),
});
