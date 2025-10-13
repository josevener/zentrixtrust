import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const protectedRoutes = ["/marketplace", "/profile", "/dashboard"];
const authRoutes = ["/login", "/signup"]; // public routes where logged-in users should NOT go

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Extract token from cookies or Authorization header
  const token =
    req.cookies.get("token")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  let isAuthenticated = false;

  if (token) {
    try {
      jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET!);
      isAuthenticated = true;
    } catch (err) {
      console.error("Invalid token:", err);
    }
  }

  // If the route is protected and user not logged in → redirect to /login
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname); // Save the path they tried to access
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in and tries to access login/signup → redirect to last visited or /marketplace
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  if (isAuthRoute && isAuthenticated) {
    const redirectTo =
      req.nextUrl.searchParams.get("from") || "/marketplace";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // Otherwise, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/marketplace/:path*",
    "/profile/:path*",
    "/dashboard/:path*",
    "/login",
    "/signup",
  ],
  runtime: "nodejs",
};
