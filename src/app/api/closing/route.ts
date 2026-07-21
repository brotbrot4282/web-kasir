import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { closingSchema } from "@/lib/validations";
import { getTodayWIB } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { username: session.username } });
    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = closingSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { catatan, belanjaUrgent } = parsed.data;

    if (!session.shift) {
      return NextResponse.json({ error: "Shift tidak ditemukan" }, { status: 400 });
    }

    const today = getTodayWIB();

    const existing = await prisma.dailyReport.findFirst({
      where: {
        tanggal: { gte: today },
        shift: session.shift as "SHIFT_1" | "SHIFT_2",
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Open shift belum dilakukan untuk shift ini" }, { status: 400 });
    }

    const start = existing.openedAt;
    const end = new Date();

    const items = await prisma.itemTransaksi.findMany({
      where: {
        transaksi: {
          createdAt: { gte: start, lte: end },
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

    let totalMakanan = 0;
    let totalMinuman = 0;
    let totalOmset = 0;

    for (const item of items) {
      totalOmset += item.subtotal;
      if (item.menu.kategori.nama === "Makanan") {
        totalMakanan += item.jumlah;
      } else {
        totalMinuman += item.jumlah;
      }
    }

    const totalBelanjaUrgent = belanjaUrgent?.reduce((sum, item) => sum + item.nominal, 0) ?? 0;

    const totalTransaksi = await prisma.transaksi.count({
      where: {
        createdAt: { gte: start, lte: end },
      },
    });

    const report = await prisma.dailyReport.update({
      where: { id: existing.id },
      data: {
        catatan: catatan || null,
        ...(belanjaUrgent ? { belanjaUrgent } : {}),
        totalMakanan,
        totalMinuman,
        totalOmset: Math.max(0, totalOmset - totalBelanjaUrgent),
        totalTransaksi,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan laporan closing" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");

    const dateFilter: Record<string, Date> = {};
    if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
    if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

    const where = dari || sampai ? { tanggal: dateFilter } : {};

    console.log("[Closing GET]", {
      user: session.username,
      dari,
      sampai,
      where,
    });

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { tanggal: "desc" },
      include: { user: { select: { nama: true } } },
    });

    console.log("[Closing GET] Found", reports.length, "reports");

    return NextResponse.json(reports);
  } catch (error) {
    console.error("[Closing GET] Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data closing" }, { status: 500 });
  }
}
