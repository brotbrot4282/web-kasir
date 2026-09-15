import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await prisma.$transaction(async (tx) => {
      await tx.rewardPoin.deleteMany({});
      await tx.member.updateMany({ data: { poin: 0 } });
      await tx.transaksi.deleteMany({});
      await tx.dailyReport.deleteMany({});
      await tx.menu.deleteMany({});
      await tx.kategori.deleteMany({});
    });

    return NextResponse.json({ message: "Semua data berhasil direset" });
  } catch {
    return NextResponse.json({ error: "Gagal mereset data" }, { status: 500 });
  }
}