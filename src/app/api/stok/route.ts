import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { stokCreateSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stok = await prisma.stok.findMany({
    orderBy: { namaBahan: "asc" },
  });
  return NextResponse.json(stok);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = stokCreateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { namaBahan, jumlah, satuan, hargaBahan } = parsed.data;

    const bahan = await prisma.stok.create({
      data: {
        namaBahan: namaBahan.trim(),
        jumlah,
        satuan,
        hargaBahan: hargaBahan ?? 0,
      },
    });

    return NextResponse.json(bahan, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan stok" }, { status: 500 });
  }
}
