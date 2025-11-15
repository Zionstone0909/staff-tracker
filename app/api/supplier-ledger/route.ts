import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Assumed helper for database operations

// --- Authorization Helper ---
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'staff' | 'user';
}

const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('Bearer token missing in authorization header.');
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable not set.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      return decoded;
    }
    return null;
  } catch (err) {
    console.error('JWT verification failed:', err instanceof Error ? err.message : String(err));
    return null;
  }
};
// --- End Authorization Helper ---

// Supplier ledger payload interface
interface SupplierLedgerPayload {
  supplier_id: number;
  transaction_type: 'purchase' | 'payment';
  amount: number;
  description: string;
}

// GET - Fetch all ledger entries for staff and admins
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const entries = await query(
      `SELECT id, supplier_id, transaction_type, amount, description, transaction_date, recorded_by_user_id
       FROM supplier_ledger
       ORDER BY transaction_date DESC`
    );
    return NextResponse.json(entries);
  } catch (err) {
    console.error('[v1] Supplier ledger GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch supplier ledger entries' }, { status: 500 });
  }
}

// POST - Record a new supplier ledger entry
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const data: SupplierLedgerPayload = await request.json();

    // Input validation
    if (typeof data.supplier_id !== 'number' || data.supplier_id <= 0) {
      return NextResponse.json({ error: 'Valid supplier_id is required' }, { status: 400 });
    }
    if (typeof data.amount !== 'number' || data.amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }
    if (!data.description || typeof data.description !== 'string' || data.description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    if (data.transaction_type !== 'purchase' && data.transaction_type !== 'payment') {
      return NextResponse.json({ error: 'Invalid transaction_type' }, { status: 400 });
    }

    // Server-side date
    const transactionDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const insertSql = `
      INSERT INTO supplier_ledger 
      (supplier_id, transaction_type, amount, description, transaction_date, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.supplier_id,
      data.transaction_type,
      data.amount,
      data.description,
      transactionDate,
      user.userId
    ]);

    return NextResponse.json(
      { success: true, id: result.insertId, message: 'Ledger entry recorded successfully' },
      { status: 201 }
    );
  } catch (err) {
    console.error('[v1] Supplier ledger POST error:', err);
    return NextResponse.json({ error: 'Failed to record supplier ledger entry' }, { status: 500 });
  }
}
