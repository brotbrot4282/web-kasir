import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

const publicPages = ["/login"];
const publicApiPrefixes = ["/api/auth", "/api/invoice"];

type Role = "OWNER" | "KASIR" | "DAPUR";

const roleApiAccess: Record<Role, string[]> = {
  OWNER: ["/api"],
  KASIR: [
    "/api/auth",
    "/api/transaksi",
    "/api/menu",
    "/api/kategori",
    "/api/dapur",
    "/api/member",
    "/api/pengaturan-poin",
    "/api/upload",
    "/api/invoice",
    "/api/kasir",
    "/api/laporan",
  ],
  DAPUR: ["/api/auth", "/api/dapur", "/api/invoice"],
};

const rolePageAccess: Record<Role, string[]> = {
  OWNER: ["/"],
  KASIR: ["/kasir", "/"],
  DAPUR: ["/dapur", "/"],
};

function getDefaultPage(role: Role): string {
  switch (role) {
    case "KASIR":
      return "/kasir";
    case "DAPUR":
      return "/dapur";
    case "OWNER":
      return "/";
  }
}

function hasApiAccess(role: Role, pathname: string): boolean {
  return roleApiAccess[role].some((prefix) => pathname.startsWith(prefix));
}

function hasPageAccess(role: Role, pathname: string): boolean {
  return rolePageAccess[role].some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix)
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api");

  // Public API routes
  if (publicApiPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Public pages
  if (publicPages.includes(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("session")?.value;

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let role: Role | null = null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    role = payload.role as Role;
  } catch {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("session");
    return response;
  }

  // Logged-in user visiting /login → redirect to default page
  if (pathname === "/login") {
    return NextResponse.redirect(new URL(getDefaultPage(role), request.url));
  }

  // Role-based access control
  if (isApi) {
    if (!hasApiAccess(role, pathname)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    if (!hasPageAccess(role, pathname)) {
      return NextResponse.redirect(new URL(getDefaultPage(role), request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..+).*)"],
};
