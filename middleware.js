import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  
  // Public paths
  if (path === "/" || path.startsWith("/login") || path.startsWith("/register") || path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based routing protection
  const role = token.role;

  if (path.startsWith("/dashboard/patient") && role !== "patient") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (path.startsWith("/dashboard/staff") && !["staff", "admin"].includes(role)) {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  if (path.startsWith("/dashboard/admin") && role !== "admin") {
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image/asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff2?)).*)",
  ],
};
