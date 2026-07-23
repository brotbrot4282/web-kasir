import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { poinDeductSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = poinDeductSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const message = Object.values(errors).flat()[0] || "Input tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { poin, keterangan, tipe } = parsed.data;

    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }

    if (tipe === "KURANG" && member.poin < poin) {
      return NextResponse.json(
        { error: `Poin tidak mencukupi (sisa ${member.poin})` },
        { status: 400 }
      );
    }

    const delta = tipe === "TAMBAH" ? poin : -poin;

    const [updated] = await Promise.all([
      prisma.member.update({
        where: { id },
        data: { poin: tipe === "TAMBAH" ? { increment: poin } : { decrement: poin } },
      }),
      prisma.rewardPoin.create({
        data: {
          memberId: id,
          poin: delta,
          keterangan: keterangan.trim(),
        },
      }),
    ]);

    return NextResponse.json({ poin: updated.poin });
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate poin" }, { status: 500 });
  }
}
