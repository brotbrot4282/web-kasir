import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stok = await prisma.stok.findMany({
    orderBy: { namaBahan: "asc" },
  });
  return NextResponse.json(stok);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { namaBahan, jumlah, satuan } = body;

    if (!namaBahan || typeof namaBahan !== "string" || namaBahan.trim().length === 0) {
      return NextResponse.json({ error: "Nama bahan wajib diisi" }, { status: 400 });
    }
    if (!jumlah || typeof jumlah !== "number" || jumlah <= 0) {
      return NextResponse.json({ error: "Jumlah harus angka positif" }, { status: 400 });
    }
    if (!satuan || typeof satuan !== "string") {
      return NextResponse.json({ error: "Satuan wajib diisi" }, { status: 400 });
    }

    const bahan = await prisma.stok.create({
      data: {
        namaBahan: namaBahan.trim(),
        jumlah,
        satuan,
      },
    });

    return NextResponse.json(bahan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan stok" }, { status: 500 });
  }
}
