import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password harus diisi" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json(
      { error: "Username atau password salah" },
      { status: 401 }
    );
  }

  const shift = user.shift; // null for OWNER
  const token = await signToken({ username: user.username, nama: user.nama, role: user.role, shift });
  await setSession(token);

  return NextResponse.json({ success: true, nama: user.nama, role: user.role, shift });
}
