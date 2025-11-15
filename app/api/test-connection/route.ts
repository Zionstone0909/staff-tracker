import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { query } from "@/lib/db";

// --- Authorization Helper ---
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'staff' | 'user' | 'special_admin';
}

const authorizeStaffAndAdmin = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  // In a production app, the absence of a secret should cause the app to crash on startup,
  // but for runtime safety in an API route:
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    // Check if the user's role is within the allowed list
    if (['admin', 'staff', 'special_admin'].includes(decoded.role)) {
      return decoded;
    }
    return null; // Role not authorized
  } catch (err) {
    // Log the actual JWT error for server-side debugging
    console.error("JWT verification failed:", err instanceof Error ? err.message : String(err));
    return null; // Token invalid or expired
  }
};
// --- End Authorization Helper ---

// GET - Test database connection (staff & special admin only)
export async function GET(request: NextRequest) {
  const user = authorizeStaffAndAdmin(request);
  if (!user) {
    // Return standard unauthorized response
    return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
  }

  try {
    console.log("[v1] Testing database connection initiated by user:", user.email);

    // Test query
    const result = await query("SELECT 1+1 AS test_result, NOW() AS current_time");
    console.log("[v1] Connection successful.");

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
      // Security Improvement: Do not expose raw environment variables in API responses.
      // The successful query result proves the connection works.
      // You can confirm *that* the credentials exist, but not their values.
      credentials_status: {
        host_set: !!process.env.DB_HOST,
        database_set: !!process.env.DB_NAME,
        user_set: !!process.env.DB_USER,
      },
      testResult: result // Show the result of the query
    });
  } catch (error: any) {
    console.error("[v1] Connection test failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Database connection failed",
        // Do not expose raw environment variables in API responses.
        // credentials_status: { ... }
      },
      { status: 500 }
    );
  }
}
