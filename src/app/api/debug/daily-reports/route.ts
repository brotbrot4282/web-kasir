import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getTodayWIB } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "OWNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const totalCount = await prisma.dailyReport.count();

    const allReports = await prisma.dailyReport.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { nama: true, username: true } } },
    });

    const today = getTodayWIB();

    const todayReports = await prisma.dailyReport.findMany({
      where: { tanggal: { gte: today } },
      include: { user: { select: { nama: true } } },
    });

    return NextResponse.json({
      totalCount,
      todayCount: todayReports.length,
      todayDate: today.toISOString(),
      todayReports: todayReports.map((r) => ({
        id: r.id,
        tanggal: r.tanggal.toISOString(),
        shift: r.shift,
        uangAwal: r.uangAwal,
        totalOmset: r.totalOmset,
        totalTransaksi: r.totalTransaksi,
        openedAt: r.openedAt.toISOString(),
        user: r.user.nama,
      })),
      recentReports: allReports.map((r) => ({
        id: r.id,
        tanggal: r.tanggal.toISOString(),
        shift: r.shift,
        totalOmset: r.totalOmset,
        openedAt: r.openedAt.toISOString(),
        user: r.user.nama,
      })),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Gagal mengambil data debug",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
