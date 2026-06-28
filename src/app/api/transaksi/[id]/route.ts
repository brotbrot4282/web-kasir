import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  try {
    const { id } = await params;

    const transaksi = await prisma.transaksi.findUnique({
      where: { id },
      include: {
        itemTransaksi: {
          include: { menu: true },
        },
      },
    });

    if (!transaksi) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(transaksi);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil transaksi" }, { status: 500 });
  }
}
