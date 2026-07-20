import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { menuCreateSchema } from "@/lib/validations";

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
    const parsed = menuCreateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { nama, harga, kategoriId, gambar, stok, variants } = parsed.data;

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variants: (variants as any) ?? [],
      },
      include: { kategori: true },
    });

    return NextResponse.json(menu, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan menu" }, { status: 500 });
  }
}
