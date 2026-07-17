import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let pengaturan = await prisma.pengaturanPoin.findUnique({ where: { id: 1 } });
  if (!pengaturan) {
    pengaturan = await prisma.pengaturanPoin.create({
      data: { id: 1, rupiahPerPoin: 15000, poinPerGratisItem: 5 },
    });
  }
  return NextResponse.json(pengaturan);
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { rupiahPerPoin, poinPerGratisItem } = body;

    if (typeof rupiahPerPoin !== "number" || rupiahPerPoin <= 0) {
      return NextResponse.json({ error: "Rupiah per poin harus angka positif" }, { status: 400 });
    }
    if (typeof poinPerGratisItem !== "number" || poinPerGratisItem <= 0) {
      return NextResponse.json({ error: "Poin per gratis item harus angka positif" }, { status: 400 });
    }

    const pengaturan = await prisma.pengaturanPoin.upsert({
      where: { id: 1 },
      update: { rupiahPerPoin, poinPerGratisItem },
      create: { id: 1, rupiahPerPoin, poinPerGratisItem },
    });

    return NextResponse.json(pengaturan);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
