import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db';

// --- Authorization Helper ---
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization') ?? request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const actualToken: string = authHeader.split(' ')[1];
  if (!actualToken) {
    console.error('JWT token missing');
    return null;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not set');
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

// --- GET Reports Handler ---
export async function GET(request: NextRequest) {
  // 1️⃣ Authorization
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    // 2️⃣ Determine period (day, week, month, year)
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'day';

    let dateFormat = '%b %d'; // default: day
    let interval = '7 DAY';
    let groupBy = 'DATE(date_column)';

    switch (period) {
      case 'week':
        dateFormat = 'Week %u, %Y';
        interval = '4 WEEK';
        groupBy = 'YEARWEEK(date_column, 1)';
        break;
      case 'month':
        dateFormat = '%b %Y';
        interval = '12 MONTH';
        groupBy = 'DATE_FORMAT(date_column, "%Y-%m")';
        break;
      case 'year':
        dateFormat = '%Y';
        interval = '5 YEAR';
        groupBy = 'YEAR(date_column)';
        break;
    }

    // 3️⃣ Chart data
    const chartData: any[] = (await query(`
      SELECT 
        DATE_FORMAT(date_column, '${dateFormat}') as date, 
        SUM(sales) as sales, 
        SUM(expenses) as expenses, 
        SUM(profit) as profit
      FROM daily_summary_table
      WHERE date_column >= CURDATE() - INTERVAL ${interval}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `)) as any[];

    // 4️⃣ Summary (total sales/expenses/profit)
    const totalSummary: any[] = (await query(`
      SELECT 
        SUM(sales) as totalSales, 
        SUM(expenses) as totalExpenses, 
        SUM(profit) as totalProfit 
      FROM daily_summary_table
    `)) as any[];

    // 5️⃣ Admin special role: add payroll
    if (user.role === 'admin') {
      console.log(`Admin ${user.email} accessing full reports.`);
      const payrollSummary: any[] = (await query(`
        SELECT SUM(salary_amount) as totalPayroll 
        FROM payroll 
        WHERE status = 'paid' AND month = DATE_FORMAT(CURDATE(), '%Y-%m')
      `)) as any[];

      totalSummary[0].totalPayroll = payrollSummary[0]?.totalPayroll ?? 0;
    } else {
      console.log(`Staff ${user.email} accessing basic reports.`);
    }

    // 6️⃣ Return response
    return NextResponse.json({
      chartData,
      summary: totalSummary[0],
      role: user.role,
    });

  } catch (error) {
    console.error("[Reports GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch reports data" }, { status: 500 });
  }
}
