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
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const tokenArray = authHeader.split(' '); 
  // Get the actual token string at index 1
  const tokenString = tokenArray[1]; 

  if (!tokenString) {
      console.error("Token string missing after split.");
      return null;
  }
  
  const secret = process.env.JWT_SECRET;
  if (!secret) {
      console.error("JWT_SECRET environment variable is not set.");
      return null;
  }

  try {
    const decoded = jwt.verify(tokenString, secret);
    const userPayload = decoded as unknown as AuthUserPayload; 

    if (userPayload.role === 'admin' || userPayload.role === 'staff') {
      return userPayload;
    }
    return null;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
};

// --- End Authorization Helper ---

interface CustomerRecord {
    id: number;
    name: string;
    email: string;
    phone: string;
    recorded_by_user_id: number;
}


export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    // Admins and staff can view all customers in this route
    const customers = await query("SELECT * FROM customers");
    return NextResponse.json(customers);
  } catch (error) {
    console.error("[v0] Customers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
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
      INSERT INTO customers 
      (name, email, phone, recorded_by_user_id) 
      VALUES (?, ?, ?, ?)
    `;
    
    const result: any = await query(insertSql, [
      data.name, 
      data.email, 
      data.phone,
      user.userId // Link the new customer record to the staff/admin who created it
    ]);

    const newCustomerId = result.insertId;

    return NextResponse.json({ success: true, id: newCustomerId });
  } catch (error) {
    console.error("[v0] Customers POST error:", error);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}

/**
 * Handles PUT requests to update existing customer data (Admins only).
 */
export async function PUT(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  // --- ADMIN ONLY SPECIAL ROLE CHECK ---
  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden: Admins only can update customer records' }, { status: 403 });
  }
  // --- END ADMIN ONLY CHECK ---

  try {
    const data = (await request.json()) as CustomerRecord;

    const updateSql = `
      UPDATE customers 
      SET name = ?, email = ?, phone = ?
      WHERE id = ?
    `;

    const result: any = await query(updateSql, [
      data.name,
      data.email,
      data.phone,
      data.id, // ID of the record to update
    ]);

    if (result.affectedRows === 0) {
        return NextResponse.json({ error: 'Customer record not found or not updated' }, { status: 404 });
    }

    return NextResponse.json({ success: true, id: data.id, message: 'Customer record updated' });
  } catch (error) {
    console.error('[v0] Customers PUT error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to remove customer data (Admins only).
 * Expects the ID to be passed as a query parameter (e.g., /api/customers?id=123)
 */
export async function DELETE(request: NextRequest) {
    const user = authorizeAdminAndStaff(request);
    if (!user) {
        return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
    }

    // --- ADMIN ONLY SPECIAL ROLE CHECK ---
    if (user.role !== 'admin') {
        return NextResponse.json({ message: 'Forbidden: Admins only can delete customer records' }, { status: 403 });
    }
    // --- END ADMIN ONLY CHECK ---

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing customer record ID' }, { status: 400 });
        }

        const deleteSql = "DELETE FROM customers WHERE id = ?";
        const result: any = await query(deleteSql, [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Customer record not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: `Record ${id} deleted` });
    } catch (error) {
        console.error('[v0] Customers DELETE error:', error);
        return NextResponse.json({ error: 'Failed to delete customer record' }, { status: 500 });
    }
}
