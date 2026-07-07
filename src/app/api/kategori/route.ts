import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kategori = await prisma.kategori.findMany({
    orderBy: { nama: "asc" },
    include: { _count: { select: { menu: true } } },
  });
  return NextResponse.json(kategori);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { nama } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kategori.findUnique({ where: { nama: nama.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Kategori sudah ada" }, { status: 400 });
    }

    const kategori = await prisma.kategori.create({
      data: { nama: nama.trim() },
    });

    return NextResponse.json(kategori, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan kategori" }, { status: 500 });
  }
}
