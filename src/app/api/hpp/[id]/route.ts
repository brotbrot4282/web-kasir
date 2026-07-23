import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resepUpdateSchema } from "@/lib/validations";

type Params = Promise<{ id: string }>;

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = resepUpdateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const existing = await prisma.resep.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Resep tidak ditemukan" }, { status: 404 });
    }

    const resep = await prisma.resep.update({
      where: { id },
      data: { jumlah: parsed.data.jumlah },
      include: { stok: true },
    });

    return NextResponse.json(resep);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate resep" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const existing = await prisma.resep.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Resep tidak ditemukan" }, { status: 404 });
    }

    await prisma.resep.delete({ where: { id } });

    return NextResponse.json({ message: "Bahan berhasil dihapus dari resep" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus resep" }, { status: 500 });
  }
}
