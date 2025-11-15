// app/api/admin/login/routes.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client'; // Use import syntax
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient(); // Initialize Prisma

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const staff = await prisma.staff.findUnique({ where: { email } });
    if (!staff) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, staff.password);
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not defined");

    const token = jwt.sign(
      { id: staff.id, email: staff.email, role: "staff" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      user: {
        id: staff.id,
        email: staff.email,
        role: "staff",
        token,
      },
    });
  } catch (error) {
    console.error("Staff login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    await prisma.$disconnect(); 
  }
}
