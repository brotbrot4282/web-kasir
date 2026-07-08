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
      transaksi: {
        createdAt: { gte: todayStart },
      },
    },
    include: {
      menu: {
        select: {
          kategori: { select: { nama: true } },
        },
      },
    },
  });

  let cup = 0;
  let makanan = 0;

  for (const item of items) {
    const kat = item.menu.kategori.nama;
    if (kat === "Makanan") {
      makanan += item.jumlah;
    } else {
      cup += item.jumlah;
    }
  }

  return NextResponse.json({ cup, makanan });
}
