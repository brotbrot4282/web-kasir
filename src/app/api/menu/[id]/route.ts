import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nama, harga, kategoriId, gambar, stok, isTersedia } = body;

    const existing = await prisma.menu.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }

    if (kategoriId) {
      const kategori = await prisma.kategori.findUnique({ where: { id: kategoriId } });
      if (!kategori) {
        return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
      }
    }

    const menu = await prisma.menu.update({
      where: { id },
      data: {
        ...(nama !== undefined ? { nama: nama.trim() } : {}),
        ...(harga !== undefined ? { harga } : {}),
        ...(kategoriId !== undefined ? { kategoriId } : {}),
        ...(gambar !== undefined ? { gambar } : {}),
        ...(stok !== undefined ? { stok } : {}),
        ...(isTersedia !== undefined ? { isTersedia } : {}),
      },
      include: { kategori: true },
    });

    return NextResponse.json(menu);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate menu" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const { id } = await params;

    const existing = await prisma.menu.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }

    const transaksiCount = await prisma.itemTransaksi.count({ where: { menuId: id } });
    if (transaksiCount > 0) {
      return NextResponse.json(
        { error: "Menu sudah memiliki riwayat transaksi, tidak bisa dihapus" },
        { status: 400 }
      );
    }

    await prisma.menu.delete({ where: { id } });

    return NextResponse.json({ message: "Menu berhasil dihapus" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus menu" }, { status: 500 });
  }
}
