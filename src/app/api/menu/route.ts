import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const menu = await prisma.menu.findMany({
    orderBy: { nama: "asc" },
    include: { kategori: true },
  });
  return NextResponse.json(menu);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { nama, harga, kategoriId, gambar, stok } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json({ error: "Nama menu wajib diisi" }, { status: 400 });
    }
    if (!harga || typeof harga !== "number" || harga <= 0) {
      return NextResponse.json({ error: "Harga harus berupa angka positif" }, { status: 400 });
    }
    if (!kategoriId) {
      return NextResponse.json({ error: "Kategori wajib dipilih" }, { status: 400 });
    }

    const kategori = await prisma.kategori.findUnique({ where: { id: kategoriId } });
    if (!kategori) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
    }

    const menu = await prisma.menu.create({
      data: {
        nama: nama.trim(),
        harga,
        kategoriId,
        gambar: gambar || null,
        stok: stok ?? 0,
        variants: body.variants ?? [],
      },
      include: { kategori: true },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan menu" }, { status: 500 });
  }
}
