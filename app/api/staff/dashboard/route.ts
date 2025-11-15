import { NextResponse } from "next/server";

interface DashboardMetrics {
  totalSales: number;
  totalProfit: number;
  weeklyExpenses: number;
  stockAdjustmentsCount: number;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // In a real application, validate the token
    if (!token || token.length < 5) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Example data that matches the frontend interface
    const metrics: DashboardMetrics = {
      totalSales: 450000,
      totalProfit: 120000,
      weeklyExpenses: 73200,
      stockAdjustmentsCount: 5,
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
