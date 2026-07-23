import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resepSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const menus = await prisma.menu.findMany({
    orderBy: { nama: "asc" },
    include: {
      kategori: true,
      resep: {
        include: { stok: true },
      },
    },
  });

  return NextResponse.json(menus);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = resepSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { menuId, stokId, jumlah } = parsed.data;

    const menu = await prisma.menu.findUnique({ where: { id: menuId } });
    if (!menu) {
      return NextResponse.json({ error: "Menu tidak ditemukan" }, { status: 400 });
    }

    const stok = await prisma.stok.findUnique({ where: { id: stokId } });
    if (!stok) {
      return NextResponse.json({ error: "Bahan tidak ditemukan" }, { status: 400 });
    }

    const existing = await prisma.resep.findUnique({
      where: { menuId_stokId: { menuId, stokId } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bahan ini sudah ada di resep menu" },
        { status: 400 }
      );
    }

    const resep = await prisma.resep.create({
      data: { menuId, stokId, jumlah },
      include: { stok: true },
    });

    return NextResponse.json(resep, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan resep" }, { status: 500 });
  }
}
