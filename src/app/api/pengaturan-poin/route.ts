import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { pengaturanPoinSchema } from "@/lib/validations";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let pengaturan = await prisma.pengaturanPoin.findUnique({ where: { id: 1 } });
  if (!pengaturan) {
    pengaturan = await prisma.pengaturanPoin.create({
      data: { id: 1, rupiahPerPoin: 15000, poinPerGratisItem: 5 },
    });
  }
  return NextResponse.json(pengaturan);
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const parsed = pengaturanPoinSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { rupiahPerPoin, poinPerGratisItem, minimalTransaksi } = parsed.data;

    const pengaturan = await prisma.pengaturanPoin.upsert({
      where: { id: 1 },
      update: { rupiahPerPoin, poinPerGratisItem, minimalTransaksi },
      create: { id: 1, rupiahPerPoin, poinPerGratisItem, minimalTransaksi },
    });

    return NextResponse.json(pengaturan);
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
