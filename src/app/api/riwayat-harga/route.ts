import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const stokId = searchParams.get("stokId");

  const where = stokId ? { stokId } : {};

  const riwayat = await prisma.riwayatHarga.findMany({
    where,
    include: { stok: { select: { namaBahan: true, satuan: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(riwayat);
}
