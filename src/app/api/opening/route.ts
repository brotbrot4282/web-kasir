import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { openingSchema } from "@/lib/validations";
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

    if (!session.shift) {
      return NextResponse.json({ error: "Shift tidak ditemukan" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = openingSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { uangAwal } = parsed.data;

    const today = getTodayWIB();

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

    const today = getTodayWIB();

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
