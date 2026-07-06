import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const member = await prisma.member.findUnique({
      where: { id },
      select: {
        id: true,
        noWa: true,
        nama: true,
        poin: true,
        createdAt: true,
        rewardPoin: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            poin: true,
            keterangan: true,
            createdAt: true,
            transaksi: {
              select: { noTransaksi: true },
            },
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(member);
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data member" }, { status: 500 });
  }
}
