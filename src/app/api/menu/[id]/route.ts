import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";

type Params = Promise<{ id: string }>;

function getFilenameFromUrl(url: string): string | null {
  try {
    const parts = url.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

async function deleteImageFromStorage(url: string | null) {
  if (!url) return;
  const filename = getFilenameFromUrl(url);
  if (!filename) return;
  await supabase.storage.from("menu-images").remove([filename]);
}

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

    if (gambar !== undefined && gambar !== existing.gambar && existing.gambar) {
      await deleteImageFromStorage(existing.gambar);
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

    await deleteImageFromStorage(existing.gambar);

    await prisma.menu.delete({ where: { id } });

    return NextResponse.json({ message: "Menu berhasil dihapus" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus menu" }, { status: 500 });
  }
}
