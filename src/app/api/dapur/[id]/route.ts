import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  if (!["MENUNGGU", "DIMASAK", "SIAP"].includes(status)) {
    return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
  }

  const item = await prisma.itemTransaksi.findUnique({ where: { id } });
  if (!item) {
    return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 });
  }

  const updated = await prisma.itemTransaksi.update({
    where: { id },
    data: { statusDapur: status },
  });

  return NextResponse.json(updated);
}
