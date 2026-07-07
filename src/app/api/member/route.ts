import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";

  const where = search
    ? {
        OR: [
          { noWa: { contains: search } },
          { nama: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      noWa: true,
      nama: true,
      poin: true,
      createdAt: true,
    },
  });

  return NextResponse.json(members);
}
