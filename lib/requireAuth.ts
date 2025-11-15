import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { JwtPayload } from "./types";

// Check the secret at runtime
const envSecret = process.env.JWT_SECRET;
if (!envSecret) throw new Error("JWT_SECRET not set");

// From this point on, TypeScript knows `secret` is a string
const secret: string = envSecret;

export function requireAuth(req: NextRequest): JwtPayload | NextResponse {
  const token = req.cookies.get("accessToken")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const verified = jwt.verify(token, secret);

    if (typeof verified !== "object" || verified === null) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verified as JwtPayload;
    return payload;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
}
