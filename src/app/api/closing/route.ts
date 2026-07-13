import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
    const { esBatu, cupTerjual, totalMakanan, totalMinuman, totalOmset, totalTransaksi } = body;

    if (esBatu == null || cupTerjual == null) {
      return NextResponse.json({ error: "Es Batu dan Cup Terjual harus diisi" }, { status: 400 });
    }

    if (typeof esBatu !== "number" || typeof cupTerjual !== "number") {
      return NextResponse.json({ error: "Nilai harus berupa angka" }, { status: 400 });
    }

    if (esBatu < 0 || cupTerjual < 0) {
      return NextResponse.json({ error: "Nilai tidak boleh negatif" }, { status: 400 });
    }

    if (!session.shift) {
      return NextResponse.json({ error: "Shift tidak ditemukan" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyReport.findFirst({
      where: {
        tanggal: { gte: today },
        shift: session.shift as "SHIFT_1" | "SHIFT_2",
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Open shift belum dilakukan untuk shift ini" }, { status: 400 });
    }

    const report = await prisma.dailyReport.update({
      where: { id: existing.id },
      data: {
        esBatu,
        cupTerjual,
        totalMakanan: totalMakanan || 0,
        totalMinuman: totalMinuman || 0,
        totalOmset: totalOmset || 0,
        totalTransaksi: totalTransaksi || 0,
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
    if (!session || session.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const dari = searchParams.get("dari");
    const sampai = searchParams.get("sampai");

    const dateFilter: Record<string, Date> = {};
    if (dari) dateFilter.gte = new Date(dari + "T00:00:00+07:00");
    if (sampai) dateFilter.lte = new Date(sampai + "T23:59:59.999+07:00");

    const where = dari || sampai ? { tanggal: dateFilter } : {};

    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy: { tanggal: "desc" },
      include: { user: { select: { nama: true } } },
    });

    return NextResponse.json(reports);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data closing" }, { status: 500 });
  }
}
