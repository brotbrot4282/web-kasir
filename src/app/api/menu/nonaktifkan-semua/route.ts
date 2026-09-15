import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.role !== "OWNER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const result = await prisma.menu.updateMany({ data: { isTersedia: false } });

    return NextResponse.json({ message: `${result.count} menu dinonaktifkan` });
  } catch {
    return NextResponse.json({ error: "Gagal menonaktifkan menu" }, { status: 500 });
  }
}