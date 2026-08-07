import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { buildGrafikData, type Rentang } from "@/lib/grafik";

const RENTANG_VALID = ["JAM", "HARI", "MINGGU", "BULAN"];

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const rentangRaw = searchParams.get("rentang") || "BULAN";
  const rentang: Rentang = RENTANG_VALID.includes(rentangRaw) ? (rentangRaw as Rentang) : "BULAN";
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");

  const dateFilter: Record<string, Date> = {};
  if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
  if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

  const where = dari || sampai ? { createdAt: dateFilter } : {};

  const [transaksi, menus] = await Promise.all([
    prisma.transaksi.findMany({
      where,
      select: {
        createdAt: true,
        totalHarga: true,
        itemTransaksi: { select: { menuId: true, harga: true, jumlah: true } },
      },
    }),
    prisma.menu.findMany({
      select: {
        id: true,
        resep: { select: { jumlah: true, stok: { select: { hargaBahan: true } } } },
      },
    }),
  ]);

  const hppPerMenu = new Map<string, number>();
  for (const menu of menus) {
    const hpp = menu.resep.reduce((t, r) => t + r.jumlah * r.stok.hargaBahan, 0);
    hppPerMenu.set(menu.id, hpp);
  }

  const dataTx = transaksi.map((t) => {
    let laba = 0;
    for (const item of t.itemTransaksi) {
      const hpp = hppPerMenu.get(item.menuId) ?? 0;
      laba += (item.harga - hpp) * item.jumlah;
    }
    return { createdAt: t.createdAt, totalHarga: t.totalHarga, laba: Math.round(laba) };
  });

  const data = buildGrafikData(
    dataTx,
    rentang,
    dari ? new Date(dari + "T00:00:00+07:00") : undefined,
    sampai ? new Date(sampai + "T23:59:59.999+07:00") : undefined,
  );

  return NextResponse.json({
    rentang,
    data,
    ringkasan: {
      totalOmset: data.reduce((s, d) => s + d.omset, 0),
      totalTransaksi: data.reduce((s, d) => s + d.transaksi, 0),
      totalLaba: data.reduce((s, d) => s + d.laba, 0),
      titik: data.length,
    },
  });
}
