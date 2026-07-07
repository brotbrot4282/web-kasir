import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { namaBahan, jumlah, satuan } = body;

    const existing = await prisma.stok.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
    }

    const bahan = await prisma.stok.update({
      where: { id },
      data: {
        ...(namaBahan !== undefined ? { namaBahan: namaBahan.trim() } : {}),
        ...(jumlah !== undefined ? { jumlah } : {}),
        ...(satuan !== undefined ? { satuan } : {}),
      },
    });

    return NextResponse.json(bahan);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate stok" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.stok.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
    }

    await prisma.stok.delete({ where: { id } });

    return NextResponse.json({ message: "Bahan berhasil dihapus" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus bahan" }, { status: 500 });
  }
}
