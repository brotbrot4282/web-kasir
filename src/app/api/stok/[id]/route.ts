import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stokUpdateSchema } from "@/lib/validations";

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = stokUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    const existing = await prisma.stok.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 404 });
    }

    const bahan = await prisma.stok.update({
      where: { id },
      data: {
        ...(data.namaBahan !== undefined ? { namaBahan: data.namaBahan.trim() } : {}),
        ...(data.jumlah !== undefined ? { jumlah: data.jumlah } : {}),
        ...(data.satuan !== undefined ? { satuan: data.satuan } : {}),
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
