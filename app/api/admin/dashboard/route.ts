// app/api/staff/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

// Initialize Prisma
const prisma = new PrismaClient();

// JWT payload interface
interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export async function GET(req: NextRequest) {
  try {
    // --- AUTHENTICATION ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET not defined");
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;
    } catch {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== "staff") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // --- STAFF METRICS ---
    const staffId = payload.id;

    const [totalSalesResult, totalDepositsResult] = await Promise.all([
      prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { staffId },
      }),
      prisma.deposit.aggregate({
        _sum: { amount: true },
        where: { staffId },
      }),
    ]);

    const totalSales = totalSalesResult._sum.totalAmount ?? 0;
    const totalDeposits = totalDepositsResult._sum.amount ?? 0;

    return NextResponse.json({
      metrics: {
        totalSales,
        totalDeposits,
      },
    });
  } catch (error) {
    console.error("Staff Dashboard Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
