import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Import your MySQL query function

// --- Authorization Helper ---

interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const actualToken = authHeader.split(' ')[1];
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
    if (decoded.role === 'admin' || decoded.role === 'staff') return decoded;
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
};

// --- End Authorization Helper ---

// Define interfaces for your DB results
interface PaymentSummary {
  method: string;
  total: number;
}

interface ChartData {
  date: string;
  cash: number;
  transfer: number;
}

export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });

  try {
    // ✅ Cast the query result properly
    const summaryData = (await query(`SELECT method, SUM(amount) as total FROM payments GROUP BY method`)) as PaymentSummary[];
    const chartData = (await query(`
      SELECT 
        DATE_FORMAT(payment_date, '%a') as date, 
        SUM(CASE WHEN method = 'cash' THEN amount ELSE 0 END) as cash,
        SUM(CASE WHEN method = 'transfer' THEN amount ELSE 0 END) as transfer
      FROM payments
      WHERE payment_date >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DATE_FORMAT(payment_date, '%a')
      ORDER BY payment_date ASC
    `)) as ChartData[];

    let cashTotal = 0;
    let transferTotal = 0;
    summaryData.forEach(row => {
      if (row.method === 'cash') cashTotal = row.total;
      if (row.method === 'transfer') transferTotal = row.total;
    });

    return NextResponse.json({
      summary: { cashTotal, transferTotal },
      chartData,
      role: user.role
    });

  } catch (error) {
    console.error("[v0] Payment Methods GET error:", error);
    return NextResponse.json({ error: "Failed to fetch payment data" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden: Admins only', status: 403 });

  try {
    const data = await request.json();
    console.log("Admin updating payment settings:", data);
    // TODO: Implement DB update logic

    return NextResponse.json({ success: true, message: 'Payment settings updated by admin' });
  } catch (error) {
    console.error('[v0] Payment Methods PUT error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  if (user.role !== 'admin') return NextResponse.json({ message: 'Forbidden: Admins only', status: 403 });

  // TODO: Implement delete logic
  return NextResponse.json({ success: true, message: 'Delete action performed by admin' });
}

export async function OPTIONS() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  return new NextResponse(null, { status: 204, headers });
}
