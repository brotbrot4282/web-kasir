import { resolve } from "path";
import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: resolve(__dirname, "../.env"), override: true });

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const reports = await prisma.dailyReport.findMany({
    orderBy: { tanggal: "asc" },
  });

  console.log(`Found ${reports.length} daily reports to backfill`);

  for (const r of reports) {
    const start = r.tanggal;
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

    const grouped = await prisma.transaksi.groupBy({
      by: ["metodeBayar"],
      where: { createdAt: { gte: start, lt: end } },
      _sum: { totalBayar: true, kembalian: true },
    });

    const pembayaran: Record<string, number> = { CASH: 0, QRIS: 0, CARD: 0 };
    for (const g of grouped) {
      pembayaran[g.metodeBayar] = (g._sum.totalBayar ?? 0) - (g._sum.kembalian ?? 0);
    }

    const jumlahTransaksi = await prisma.transaksi.count({
      where: { createdAt: { gte: start, lt: end } },
    });

    console.log(
      `  ${r.id} [${r.shift}] tgl=${start.toISOString()} -> cash=${pembayaran.CASH} qris=${pembayaran.QRIS} card=${pembayaran.CARD} (${jumlahTransaksi} transaksi)`
    );

    await prisma.dailyReport.update({
      where: { id: r.id },
      data: {
        totalCash: pembayaran.CASH,
        totalQris: pembayaran.QRIS,
        totalCard: pembayaran.CARD,
      },
    });
  }

  console.log("\nDone!");
}

main()
  .catch((e) => { console.error("Failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
