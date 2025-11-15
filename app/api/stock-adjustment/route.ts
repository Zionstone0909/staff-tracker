import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Ensure this is a proper MySQL/PostgreSQL query function

// --- Authorization Helper ---
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('Token string missing after split.');
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET environment variable is not set.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    if (decoded.role === 'admin' || decoded.role === 'staff') return decoded;
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
};
// --- End Authorization Helper ---

interface StockAdjustmentPayload {
  item_id: number;
  quantity_adjusted: number;
  reason: string;
}

// GET - fetch stock adjustments
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const adjustments = await query(
      `SELECT id, item_id, quantity_adjusted, reason, adjustment_date, recorded_by_user_id
       FROM stock_adjustments
       ORDER BY adjustment_date DESC`
    );
    return NextResponse.json(adjustments);
  } catch (error) {
    console.error('[StockAdjustment GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stock adjustments' }, { status: 500 });
  }
}

// POST - create a new stock adjustment
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const data: StockAdjustmentPayload = await request.json();

    // Input validation
    if (typeof data.item_id !== 'number' || data.item_id <= 0)
      return NextResponse.json({ error: 'Valid item_id is required' }, { status: 400 });

    if (typeof data.quantity_adjusted !== 'number' || data.quantity_adjusted === 0)
      return NextResponse.json({ error: 'quantity_adjusted must be a non-zero number' }, { status: 400 });

    if (typeof data.reason !== 'string' || !data.reason.trim())
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });

    const adjustmentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const insertSql = `
      INSERT INTO stock_adjustments 
      (item_id, quantity_adjusted, reason, adjustment_date, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.item_id,
      data.quantity_adjusted,
      data.reason,
      adjustmentDate,
      user.userId,
    ]);

    return NextResponse.json(
      { success: true, id: result.insertId, message: 'Stock adjustment recorded successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[StockAdjustment POST] Error:', error);
    return NextResponse.json({ error: 'Failed to record stock adjustment' }, { status: 500 });
  }
}

// DELETE - remove a stock adjustment (Admins only)
export async function DELETE(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only can delete adjustment records' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');
    if (!idParam) return NextResponse.json({ error: 'Missing adjustment record ID' }, { status: 400 });

    const id = parseInt(idParam, 10);
    if (isNaN(id) || id <= 0) return NextResponse.json({ error: 'Invalid adjustment record ID' }, { status: 400 });

    const deleteSql = 'DELETE FROM stock_adjustments WHERE id = ?';
    const result: any = await query(deleteSql, [id]);

    if (result.affectedRows === 0)
      return NextResponse.json({ error: 'Adjustment record not found' }, { status: 404 });

    return NextResponse.json({ success: true, message: `Record ${id} deleted successfully` }, { status: 200 });
  } catch (error) {
    console.error('[StockAdjustment DELETE] Error:', error);
    return NextResponse.json({ error: 'Failed to delete adjustment record' }, { status: 500 });
  }
}
