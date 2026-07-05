import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "warmindo-secret-key-change-in-production"
);

const publicRoutes = ["/login", "/api/auth"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const isProtected =
    pathname === "/" ||
    pathname.startsWith("/kasir") ||
    pathname.startsWith("/admin");

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const user = payload as { username: string; nama: string; role: string; shift?: string };

    // Role-based routing
    if (user.role === "KASIR" && pathname !== "/kasir") {
      return NextResponse.redirect(new URL("/kasir", request.url));
    }

    if (user.role === "OWNER" && pathname === "/kasir") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
