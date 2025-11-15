import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { query } from "@/lib/db";

// Type for token payload
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

// ✅ Helper function to verify the token and check roles
const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  // Extract token (fix: get token[1], not full array)
  const token = authHeader.split(" ")[1];
  if (!token) {
    console.error("Token string missing after split.");
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET environment variable is not set.");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;

    // Check allowed roles
    if (decoded.role === "admin" || decoded.role === "staff") {
      return decoded;
    }

    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};

// ✅ GET: Fetch expenses
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
  }

  try {
    let whereClause = "";
    if (user.role === "staff") {
      whereClause = ` WHERE initiated_by_user_id = ?`;
    }

    const expenses = await query(
      `SELECT * FROM company_expenses${whereClause}`,
      user.role === "staff" ? [user.userId] : []
    );

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("[v0] Company expenses GET error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

// ✅ POST: Add new expense
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized access" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const insertSql =
      "INSERT INTO company_expenses (description, amount, initiated_by_user_id) VALUES (?, ?, ?)";
    const result: any = await query(insertSql, [
      data.description,
      data.amount,
      user.userId,
    ]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error("[v0] Company expenses POST error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
