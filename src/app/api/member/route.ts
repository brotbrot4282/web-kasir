import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { memberCreateSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { noWa: { contains: search } },
          { nama: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      noWa: true,
      nama: true,
      poin: true,
      createdAt: true,
    },
  });

  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = memberCreateSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { noWa, nama } = parsed.data;
    const noWaTrimmed = noWa.trim();

    const existing = await prisma.member.findUnique({ where: { noWa: noWaTrimmed } });
    if (existing) {
      return NextResponse.json({ error: "Nomor WhatsApp sudah terdaftar" }, { status: 400 });
    }

    const member = await prisma.member.create({
      data: {
        noWa: noWaTrimmed,
        nama: nama?.trim() || null,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat member" }, { status: 500 });
  }
}
