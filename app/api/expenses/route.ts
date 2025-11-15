import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // your MySQL helper

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
  // *** FIX: take the token string at index 1 ***
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
    // cast the verified payload to our AuthUserPayload shape
    const decoded = jwt.verify(actualToken, secret) as AuthUserPayload;
    if (!decoded) {
      console.error('JWT verification returned no payload.');
      return null;
    }

    if (decoded.role === 'admin' || decoded.role === 'staff') {
      return decoded;
    }

    return null; // Not an authorized role
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

// --- End Authorization Helper ---

export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    let whereClause = "";
    // --- Special Admin/Staff Logic (GET) ---
    // If the user is staff, only show expenses they initiated. Admins see all.
    if (user.role === 'staff') {
        whereClause = ` WHERE recorded_by_user_id = ${user.userId}`;
    }
    // --- End Special Logic (GET) ---

    const expenses = await query(`SELECT * FROM expenses${whereClause}`);
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('[v0] Expenses GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
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
      INSERT INTO expenses 
      (lorry_id, expense_type, amount, description, expense_date, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.lorry_id,
      data.expense_type,
      data.amount,
      data.description,
      data.expense_date,
      user.userId,
    ]);

    const newExpenseId = result.insertId;

    return NextResponse.json({ success: true, id: newExpenseId });
  } catch (error) {
    console.error('[v0] Expenses POST error:', error);
    return NextResponse.json({ error: 'Failed to add expense' }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to remove expense data (Admins only).
 * Expects the ID to be passed as a query parameter (e.g., /api/expenses?id=123)
 */
export async function DELETE(request: NextRequest) {
    const user = authorizeAdminAndStaff(request);
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
    }

    // --- Special Admin/Staff Logic (DELETE) ---
    // Only allow admins to delete expense records
    if (user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Admins only can delete expense records' }, { status: 403 });
    }
    // --- End Special Logic (DELETE) ---

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing expense record ID' }, { status: 400 });
        }

        const deleteSql = "DELETE FROM expenses WHERE id = ?";
        const result: any = await query(deleteSql, [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Expense record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Record ${id} deleted` });
    } catch (error) {
        console.error('[v0] Expenses DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete expense record' }, { status: 500 });
    }
}
