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

    if (!session.shift) {
      return NextResponse.json({ error: "Shift tidak ditemukan" }, { status: 400 });
    }

    const body = await request.json();
    const { uangAwal } = body;

    if (uangAwal == null || typeof uangAwal !== "number" || uangAwal < 0) {
      return NextResponse.json({ error: "Uang awal harus berupa angka positif" }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyReport.findFirst({
      where: {
        tanggal: { gte: today },
        shift: session.shift as "SHIFT_1" | "SHIFT_2",
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Open shift sudah dilakukan untuk shift ini hari ini" }, { status: 409 });
    }

    const report = await prisma.dailyReport.create({
      data: {
        tanggal: today,
        shift: session.shift as "SHIFT_1" | "SHIFT_2",
        userId: user.id,
        uangAwal,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan open shift" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      select: { id: true, uangAwal: true },
    });

    return NextResponse.json({ opened: !!existing, uangAwal: existing?.uangAwal ?? 0 });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data open shift" }, { status: 500 });
  }
}
