import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Your MySQL helper

// --- Authorization Helper ---
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: 'admin' | 'staff' | string;
}

const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not set');
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as AuthUserPayload;
    if (decoded.role === 'admin' || decoded.role === 'staff') return decoded;
    return null; // Unauthorized role
  } catch (err) {
    console.error('JWT verification failed:', err);
    return null;
  }
};

// --- Payroll Record Interface ---
interface PayrollRecord {
  id: number;
  staff_id: number;
  month: string;
  salary_amount: number;
  payment_date: string;
  status: 'paid' | 'unpaid' | 'pending';
}

// --- GET Payroll Records ---
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    let sql = 'SELECT * FROM payroll';
    const params: (string | number)[] = [];

    if (user.role === 'staff') {
      sql += ' WHERE staff_id = ?';
      params.push(user.userId);
    }

    const result = (await query(sql, params)) as PayrollRecord[];

    return NextResponse.json(result);
  } catch (error) {
    console.error('[v0] Payroll GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payroll records' }, { status: 500 });
  }
}

// --- POST New Payroll Record (Admins Only) ---
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });

  try {
    const data = (await request.json()) as Omit<PayrollRecord, 'id'>;

    const insertSql = `
      INSERT INTO payroll 
      (staff_id, month, salary_amount, payment_date, status, recorded_by_user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.staff_id,
      data.month,
      data.salary_amount,
      data.payment_date,
      data.status,
      user.userId,
    ]);

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('[v0] Payroll POST error:', error);
    return NextResponse.json({ error: 'Failed to add payroll' }, { status: 500 });
  }
}

// --- PUT Update Payroll Record (Admins Only) ---
export async function PUT(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });

  try {
    const data = (await request.json()) as PayrollRecord;

    const updateSql = `
      UPDATE payroll 
      SET staff_id = ?, month = ?, salary_amount = ?, payment_date = ?, status = ?
      WHERE id = ?
    `;

    const result: any = await query(updateSql, [
      data.staff_id,
      data.month,
      data.salary_amount,
      data.payment_date,
      data.status,
      data.id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: data.id, message: 'Payroll record updated' });
  } catch (error) {
    console.error('[v0] Payroll PUT error:', error);
    return NextResponse.json({ error: 'Failed to update payroll' }, { status: 500 });
  }
}

// --- DELETE Payroll Record (Admins Only) ---
export async function DELETE(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden: Admins only' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing payroll record ID' }, { status: 400 });

    const deleteSql = `DELETE FROM payroll WHERE id = ?`;
    const result: any = await query(deleteSql, [id]);

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Record ${id} deleted` });
  } catch (error) {
    console.error('[v0] Payroll DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete payroll record' }, { status: 500 });
  }
}
