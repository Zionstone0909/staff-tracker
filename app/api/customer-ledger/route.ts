import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { query } from '@/lib/db'; // Import the 'query' function from your MySQL file

// Type guard for our specific token payload
interface AuthUserPayload extends JwtPayload {
  userId: number;
  email: string;
  role: string;
}

// Helper function to verify the token and check roles
const authorizeAdminAndStaff = (request: NextRequest): AuthUserPayload | null => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  // Get the token part after 'Bearer '
  const token = authHeader.split(' ')[1]; 
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
      console.error("JWT_SECRET environment variable is not set.");
      return null;
  }

  try {
    // Pass the single 'token' string directly to jwt.verify
    const decoded = jwt.verify(token, secret);
    const userPayload = decoded as unknown as AuthUserPayload;

    if (userPayload.role === 'admin' || userPayload.role === 'staff') {
      return userPayload;
    }
    
    return null; // Role is not authorized
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null; // Token is invalid or expired
  }
};

export async function GET(request: NextRequest) {
  // Check authorization first
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    let whereClause = "";
    // --- Special Admin/Staff Logic ---
    // If the user is staff, only show ledger entries associated with customers they manage.
    // Admins see all. (This assumes you have a linking table or column in your DB)
    if (user.role === 'staff') {
        // This is a complex query example, adjust to match your actual schema
        whereClause = ` WHERE c.manager_user_id = ${user.userId}`; 
    }
    // --- End Special Logic ---
    
    // Fetch customer ledger data using your query function
    const ledgerEntries = await query(`SELECT * FROM customer_ledger AS cl JOIN customers AS c ON cl.customer_id = c.id ${whereClause}`);
    return NextResponse.json(ledgerEntries);
  } catch (error) {
    console.error("[v0] Customer ledger GET error:", error);
    return NextResponse.json({ error: "Failed to fetch ledger entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check authorization first
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const data = await request.json();

    const insertSql = `
      INSERT INTO customer_ledger 
      (customer_id, transaction_description, amount, type, recorded_by_user_id) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const result: any = await query(insertSql, [
      data.customerId, 
      data.description, 
      data.amount,
      data.type,
      user.userId // Link the record to the authenticated user
    ]);

    const newEntryId = result.insertId;

    return NextResponse.json({ success: true, id: newEntryId });
  } catch (error) {
    console.error("[v0] Customer ledger POST error:", error);
    return NextResponse.json({ error: "Failed to create ledger entry" }, { status: 500 });
  }
}
