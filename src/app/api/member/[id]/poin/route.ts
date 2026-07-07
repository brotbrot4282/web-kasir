import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { poin, keterangan } = body;

    if (!poin || typeof poin !== "number" || poin <= 0) {
      return NextResponse.json({ error: "Jumlah poin harus angka positif" }, { status: 400 });
    }

    if (!keterangan || typeof keterangan !== "string" || !keterangan.trim()) {
      return NextResponse.json({ error: "Keterangan wajib diisi" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    if (member.poin < poin) {
      return NextResponse.json(
        { error: `Poin tidak mencukupi (sisa ${member.poin})` },
        { status: 400 }
      );
    }

    const [updated] = await Promise.all([
      prisma.member.update({
        where: { id },
        data: { poin: { decrement: poin } },
      }),
      prisma.rewardPoin.create({
        data: {
          memberId: id,
          poin: -poin,
          keterangan: keterangan.trim(),
        },
      }),
    ]);

    return NextResponse.json({ poin: updated.poin });
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate poin" }, { status: 500 });
  }
}
