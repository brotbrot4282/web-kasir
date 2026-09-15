import { prisma } from "./prisma";

export type PembayaranBreakdown = { CASH: number; QRIS: number; CARD: number };

export async function hitungPembayaran(start: Date, end: Date): Promise<PembayaranBreakdown> {
  const pembayaran: PembayaranBreakdown = { CASH: 0, QRIS: 0, CARD: 0 };

  const [grouped, legacyGrouped] = await Promise.all([
    prisma.pembayaranSplit.groupBy({
      by: ["metodeBayar"],
      where: {
        transaksi: { createdAt: { gte: start, lte: end } },
      },
      _sum: { jumlah: true },
    }),
    prisma.transaksi.groupBy({
      by: ["metodeBayar"],
      where: {
        createdAt: { gte: start, lte: end },
        pembayaranSplit: { none: {} },
      },
      _sum: { totalBayar: true, kembalian: true },
    }),
  ]);

  const keys = ["CASH", "QRIS", "CARD"] as const;
  for (const g of grouped) {
    const key = g.metodeBayar as (typeof keys)[number];
    if (keys.includes(key)) {
      pembayaran[key] += g._sum.jumlah ?? 0;
    }
  }
  for (const g of legacyGrouped) {
    const key = g.metodeBayar as (typeof keys)[number];
    if (keys.includes(key)) {
      const diterima = (g._sum.totalBayar ?? 0) - (g._sum.kembalian ?? 0);
      pembayaran[key] += diterima;
    }
  }
  return pembayaran;
}