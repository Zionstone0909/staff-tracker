import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SECRET_KEY = process.env.JWT_SECRET;
if (!SECRET_KEY) throw new Error("JWT_SECRET not set");

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(req: any) {
  try {
    const { email, password }: LoginRequest = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password required" },
        { status: 400 }
      );
    }

    // Check Admin first
    let user = await prisma.admin.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
    let role: "admin" | "staff" = "admin";

    if (!user) {
      user = await prisma.staff.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
      });
      role = "staff";
    }

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Use non-null assertion (!) to satisfy TypeScript
    const token = jwt.sign(
      { id: user.id, email: user.email, role },
      SECRET_KEY!,
      { expiresIn: "1h" }
    );

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: "Login successful",
      user: { id: user.id, email: user.email, role },
    });

    response.cookies.set({
      name: "authToken",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60, // 1 hour
    });

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
