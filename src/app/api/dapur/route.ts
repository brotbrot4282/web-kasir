import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const items = await prisma.itemTransaksi.findMany({
    where: {
      statusDapur: { in: ["MENUNGGU", "DIMASAK"] },
      transaksi: {
        createdAt: { gte: todayStart },
      },
    },
    include: {
      transaksi: {
        select: {
          noTransaksi: true,
          createdAt: true,
          noWa: true,
          totalHarga: true,
        },
      },
      menu: {
        select: {
          nama: true,
          kategori: { select: { nama: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}
