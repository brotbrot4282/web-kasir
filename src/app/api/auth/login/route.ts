import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken, setSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(`login:${ip}`, { max: 5, windowMs: 15 * 60 * 1000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." },
      { status: 429 }
    );
  }

  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const error = parsed.error.flatten().fieldErrors;
    const message = Object.values(error).flat()[0] || "Input tidak valid";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await verifyPassword(password, user.password))) {
    return NextResponse.json(
      { error: "Username atau password salah" },
      { status: 401 }
    );
  }

  const shift = user.shift;
  const token = await signToken({ username: user.username, nama: user.nama, role: user.role, shift });
  await setSession(token);

  return NextResponse.json({ success: true, nama: user.nama, role: user.role, shift });
}
