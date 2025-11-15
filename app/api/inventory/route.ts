import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // MySQL helper

// ------------------- TYPES -------------------
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

export interface InventoryRecord {
  id: number;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  reorder_level: number;
  recorded_by_user_id: number;
}

export interface InventoryCreateInput {
  item_name: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
}

export interface InventoryUpdateInput {
  id: number;
  item_name?: string;
  quantity?: number;
  unit_price?: number;      // staff cannot modify
  reorder_level?: number;   // staff cannot modify
}

// ------------------- AUTHORIZATION -------------------
const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    if (decoded.role === 'admin' || decoded.role === 'staff') return decoded;
    return null;
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
};

// ------------------- GET -------------------
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const inventoryItems = await query('SELECT * FROM inventory') as InventoryRecord[];
    return NextResponse.json(inventoryItems);
  } catch (err) {
    console.error('[Inventory GET error]', err);
    return NextResponse.json({ error: 'Failed to fetch inventory items' }, { status: 500 });
  }
}

// ------------------- POST -------------------
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const data = (await request.json()) as InventoryCreateInput;

    if (user.role === 'staff' && data.quantity < 0) {
      return NextResponse.json({ error: 'Staff cannot record negative inventory adjustments' }, { status: 403 });
    }

    const totalValue = data.quantity * data.unit_price;

    const insertSql = `
      INSERT INTO inventory 
      (item_name, quantity, unit_price, total_value, reorder_level, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.item_name,
      data.quantity,
      data.unit_price,
      totalValue,
      data.reorder_level,
      user.userId,
    ]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('[Inventory POST error]', err);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

// ------------------- PUT -------------------
export async function PUT(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    const data = (await request.json()) as InventoryUpdateInput;

    if (user.role === 'staff') {
      if (data.unit_price !== undefined || data.reorder_level !== undefined) {
        return NextResponse.json({ error: 'Forbidden: Staff cannot modify unit price or reorder level' }, { status: 403 });
      }
    }

    const updateSql = `
      UPDATE inventory 
      SET item_name = COALESCE(?, item_name),
          quantity = COALESCE(?, quantity),
          unit_price = COALESCE(?, unit_price),
          reorder_level = COALESCE(?, reorder_level)
      WHERE id = ?
    `;

    const result: any = await query(updateSql, [
      data.item_name ?? null,
      data.quantity ?? null,
      data.unit_price ?? null,
      data.reorder_level ?? null,
      data.id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Inventory item not found or not updated' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: data.id, message: 'Inventory record updated' });
  } catch (err) {
    console.error('[Inventory PUT error]', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

// ------------------- DELETE -------------------
export async function DELETE(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only can delete inventory records' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing inventory record ID' }, { status: 400 });

    const deleteSql = 'DELETE FROM inventory WHERE id = ?';
    const result: any = await query(deleteSql, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Record ${id} deleted` });
  } catch (err) {
    console.error('[Inventory DELETE error]', err);
    return NextResponse.json({ error: 'Failed to delete inventory record' }, { status: 500 });
  }
}
