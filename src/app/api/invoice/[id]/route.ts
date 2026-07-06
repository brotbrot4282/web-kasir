import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const transaksi = await prisma.transaksi.findUnique({
      where: { publicId: id },
      include: {
        itemTransaksi: { orderBy: { createdAt: "asc" } },
        member: { select: { noWa: true, nama: true, poin: true } },
      },
    });
    if (!transaksi) {
      return NextResponse.json({ error: "Invoice tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(transaksi);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil invoice" }, { status: 500 });
  }
}
