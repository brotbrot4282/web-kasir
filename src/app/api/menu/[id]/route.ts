import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth";
import { menuUpdateSchema } from "@/lib/validations";

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
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = menuUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    const existing = await prisma.menu.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 404 });
    }

    if (data.kategoriId) {
      const kategori = await prisma.kategori.findUnique({ where: { id: data.kategoriId } });
      if (!kategori) {
        return NextResponse.json({ error: "Kategori tidak ditemukan" }, { status: 400 });
      }
    }

    if (data.gambar !== undefined && data.gambar !== existing.gambar && existing.gambar) {
      await deleteImageFromStorage(existing.gambar);
    }

    const updateData: Record<string, unknown> = {};
    if (data.nama !== undefined) updateData.nama = data.nama.trim();
    if (data.harga !== undefined) updateData.harga = data.harga;
    if (data.kategoriId !== undefined) updateData.kategoriId = data.kategoriId;
    if (data.gambar !== undefined) updateData.gambar = data.gambar;
    if (data.stok !== undefined) updateData.stok = data.stok;
    if (data.isTersedia !== undefined) updateData.isTersedia = data.isTersedia;
    if (data.variants !== undefined) updateData.variants = data.variants;

    const menu = await prisma.menu.update({
      where: { id },
      data: updateData as never,
      include: { kategori: true },
    });

    return NextResponse.json(menu);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate menu" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
