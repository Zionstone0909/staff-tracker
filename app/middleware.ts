// app/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes
  if (pathname.startsWith("/admin")) {
    const authHeader = req.headers.get("authorization") || req.cookies.get("token")?.value;

    if (!authHeader) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    let token: string;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else {
      token = authHeader;
    }

    try {
      if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined");
      const payload = jwt.verify(token, process.env.JWT_SECRET) as { role: string };

      // Only allow admin
      if (payload.role !== "admin") {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  // Continue if not admin route or token is valid
  return NextResponse.next();
}

// Define paths where middleware applies
export const config = {
  matcher: ["/admin/:path*"], // Protect all /admin routes
};
