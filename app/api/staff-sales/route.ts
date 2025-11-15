import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Import the 'query' function from your MySQL file

// --- Authorization Helper ---

interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const authHeaderParts = authHeader.split(' ');
  const actualToken = authHeaderParts[1]; // ✅ Correct: Get the token string

  if (!actualToken) {
    console.error('Token string missing after split.');
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set.');
    return null;
  }

  try {
    const decoded = jwt.verify(actualToken, secret) as AuthUserPayload;
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      return decoded;
    }
    return null; // Not an authorized role
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null; // Token invalid or expired
  }
};

// --- End Authorization Helper ---

export async function GET(request: NextRequest) {
  // Check authorization first
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    let whereClause = '';
    const queryParams: any[] = [];
    const { searchParams } = new URL(request.url);
    const staffIdParam = searchParams.get('staff_id');

    // --- Special Admin/Staff Logic ---
    if (user.role === 'admin') {
      // Admins can view a specific staff member's sales using a query param, or all if none provided
      if (staffIdParam) {
        whereClause = ' WHERE recorded_by_user_id = ?';
        queryParams.push(staffIdParam);
      }
    } else {
      // Staff can only view their own sales
      whereClause = ' WHERE recorded_by_user_id = ?';
      queryParams.push(user.userId);
    }
    // --- End Special Logic ---

    // Fetch sales data using your query function
    const sales = await query(`SELECT * FROM sales${whereClause}`, queryParams);
    return NextResponse.json(sales);
  } catch (error) {
    console.error('[v0] Staff Sales GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales data' }, { status: 500 });
  }
}
