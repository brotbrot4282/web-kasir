import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama } = body;

    if (!nama || typeof nama !== "string" || nama.trim().length === 0) {
      return NextResponse.json({ error: "Nama kategori wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.kategori.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const duplicate = await prisma.kategori.findFirst({
      where: { nama: nama.trim(), NOT: { id } },
    });
    if (duplicate) {
      return NextResponse.json({ error: "Nama kategori sudah digunakan" }, { status: 400 });
    }

    const kategori = await prisma.kategori.update({
      where: { id },
      data: { nama: nama.trim() },
    });

    return NextResponse.json(kategori);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate kategori" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;

    const existing = await prisma.kategori.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 404 });
    }

    const menuCount = await prisma.menu.count({ where: { kategoriId: id } });
    if (menuCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus kategori yang memiliki ${menuCount} menu` },
        { status: 400 }
      );
    }

    await prisma.kategori.delete({ where: { id } });

    return NextResponse.json({ message: "Kategori berhasil dihapus" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus kategori" }, { status: 500 });
  }
}
