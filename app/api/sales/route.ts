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
  // *** THE FIX: Extract the actual token string at index 1 ***
  const actualToken: string = authHeaderParts[1]; 

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
    // Pass the single 'actualToken' string to jwt.verify
    const decoded = jwt.verify(actualToken, secret);
    const userPayload = decoded as unknown as AuthUserPayload;

    if (userPayload.role === 'admin' || userPayload.role === 'staff') {
      return userPayload;
    }
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

// --- End Authorization Helper ---

// Define an interface for the expected data structure
interface SalesRecord {
  id: number;
  customer_name: string;
  total_amount: number;
  paid_amount: number;
  payment_status: 'outstanding' | 'paid';
  payment_method: string;
  profit: number;
  recorded_by_user_id: number;
}


export async function GET(request: NextRequest) {
  // Check authorization first
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    let whereClause = "";
    // --- Special Admin/Staff Logic (GET) ---
    // Staff only view the sales records they created. Admins view all.
    if (user.role === 'staff') {
        whereClause = ` WHERE recorded_by_user_id = ${user.userId}`;
    }
    // --- End Special Logic (GET) ---

    // Fetch sales data using your query function
    const salesRecords = await query(`SELECT * FROM sales${whereClause}`);
    return NextResponse.json(salesRecords);
  } catch (error) {
    console.error("[v0] Sales GET error:", error);
    return NextResponse.json({ error: "Failed to fetch sales records" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const insertSql = `
      INSERT INTO sales 
      (customer_name, total_amount, paid_amount, payment_status, payment_method, profit, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.customer_name,
      data.total_amount, 
      data.paid_amount, 
      data.payment_status,
      data.payment_method,
      data.profit,
      user.userId // Link the sales record to the staff/admin who created it
    ]);

    const newSaleId = result.insertId;

    return NextResponse.json({ success: true, id: newSaleId });
  } catch (error) {
    console.error("[v0] Sales POST error:", error);
    return NextResponse.json({ error: "Failed to record sale" }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to remove sales data (Admins only).
 * Expects the ID to be passed as a query parameter (e.g., /api/sales?id=123)
 */
export async function DELETE(request: NextRequest) {
    const user = authorizeAdminAndStaff(request);
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
    }

    // --- Special Admin/Staff Logic (DELETE) ---
    // Only allow admins to delete sales records
    if (user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Admins only can delete sales records' }, { status: 403 });
    }
    // --- End Special Logic (DELETE) ---

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing sales record ID' }, { status: 400 });
        }

        const deleteSql = "DELETE FROM sales WHERE id = ?";
        const result: any = await query(deleteSql, [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Record ${id} deleted` });
    } catch (error) {
        console.error('[v0] Sales DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete sale record' }, { status: 500 });
    }
}
