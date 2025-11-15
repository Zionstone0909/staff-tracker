import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Make sure this is your proper DB helper

// --- Interfaces ---
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'staff' | 'user';
}

interface StockMovementPayload {
  item_id: number;
  quantity_moved: number;
  from_location_id: number;
  to_location_id: number;
}

// --- Authorization Helper ---
const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization')?.trim();
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set.');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    return ['admin', 'staff'].includes(decoded.role) ? decoded : null;
  } catch (err) {
    console.error('JWT verification failed:', err instanceof Error ? err.message : err);
    return null;
  }
};

// --- GET Handler: Fetch all stock movements ---
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    // Optional: implement pagination with query params
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const limit = Number(url.searchParams.get('limit') ?? '100');
    const offset = (page - 1) * limit;

    const movements = await query(
      `SELECT id, item_id, quantity_moved, from_location_id, to_location_id, movement_date, recorded_by_user_id
       FROM stock_movements
       ORDER BY movement_date DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return NextResponse.json({ data: movements, page, limit });
  } catch (err) {
    console.error('[StockMovement GET] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 });
  }
}

// --- POST Handler: Create a new stock movement ---
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const data: StockMovementPayload = await request.json();

    // Input validation
    if (!Number.isInteger(data.item_id) || data.item_id <= 0)
      return NextResponse.json({ error: 'Valid item_id is required' }, { status: 400 });
    if (!Number.isInteger(data.quantity_moved) || data.quantity_moved <= 0)
      return NextResponse.json({ error: 'quantity_moved must be positive' }, { status: 400 });
    if (!Number.isInteger(data.from_location_id) || data.from_location_id <= 0)
      return NextResponse.json({ error: 'Valid from_location_id is required' }, { status: 400 });
    if (!Number.isInteger(data.to_location_id) || data.to_location_id <= 0)
      return NextResponse.json({ error: 'Valid to_location_id is required' }, { status: 400 });
    if (data.from_location_id === data.to_location_id)
      return NextResponse.json({ error: 'Cannot move stock to the same location' }, { status: 400 });

    const movementDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const insertSql = `
      INSERT INTO stock_movements 
      (item_id, quantity_moved, from_location_id, to_location_id, movement_date, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.item_id,
      data.quantity_moved,
      data.from_location_id,
      data.to_location_id,
      movementDate,
      user.userId
    ]);

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: 'Stock movement recorded successfully'
    }, { status: 201 });

  } catch (err) {
    console.error('[StockMovement POST] Error:', err);
    return NextResponse.json({ error: 'Failed to record stock movement' }, { status: 500 });
  }
}
