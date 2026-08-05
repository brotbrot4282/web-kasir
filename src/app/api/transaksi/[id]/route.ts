import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = Promise<{ id: string }>;

export async function DELETE(_request: Request, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;

    const transaksi = await prisma.transaksi.findUnique({
      where: { id },
      include: {
        itemTransaksi: true,
        rewardPoin: { select: { poin: true } },
      },
    });

    if (!transaksi) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of transaksi.itemTransaksi) {
        await tx.menu.update({
          where: { id: item.menuId },
          data: { stok: { increment: item.jumlah } },
        });
      }

      if (transaksi.memberId) {
        const totalPoin = transaksi.rewardPoin.reduce((sum, rp) => sum + rp.poin, 0);
        if (totalPoin !== 0) {
          await tx.$queryRaw`
            UPDATE member SET poin = GREATEST(0, poin - ${totalPoin})
            WHERE id = ${transaksi.memberId}::uuid
          `;
        }
      }

      await tx.rewardPoin.deleteMany({ where: { transaksiId: id } });
      await tx.transaksi.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Transaksi berhasil dihapus" });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus transaksi" }, { status: 500 });
  }
}

export async function GET(_request: Request, { params }: { params: Params }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
