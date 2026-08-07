import { prisma } from "./prisma";

export type PembayaranBreakdown = { CASH: number; QRIS: number; CARD: number };

export async function hitungPembayaran(start: Date, end: Date): Promise<PembayaranBreakdown> {
  const grouped = await prisma.transaksi.groupBy({
    by: ["metodeBayar"],
    where: { createdAt: { gte: start, lte: end } },
    _sum: { totalBayar: true, kembalian: true },
  });

  const pembayaran: PembayaranBreakdown = { CASH: 0, QRIS: 0, CARD: 0 };
  for (const g of grouped) {
    const diterima = (g._sum.totalBayar ?? 0) - (g._sum.kembalian ?? 0);
    pembayaran[g.metodeBayar as "CASH" | "QRIS" | "CARD"] = diterima;
  }
  return pembayaran;
}
