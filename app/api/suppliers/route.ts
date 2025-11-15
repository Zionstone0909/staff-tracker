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
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const actualToken = authHeader.split(' ')[1]; // Correctly extract the token

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
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      return decoded;
    }
    return null;
  } catch (error) {
    console.error('JWT verification failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
};
// --- End Authorization Helper ---

interface SupplierPayload {
  name: string;
  contact_name: string;
  phone: string;
  email: string;
  address: string;
}

// GET - Fetch all suppliers for staff and admins
export async function GET(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const suppliers = await query(
      'SELECT id, name, contact_name, phone, email, address, created_at FROM suppliers ORDER BY name ASC'
    );
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('[v1] Suppliers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

// POST - Create a new supplier record for staff and admins
export async function POST(request: NextRequest) {
  const user = authorizeAdminAndStaff(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized access' }, { status: 401 });
  }

  try {
    const data: SupplierPayload = await request.json();

    // Input Validation
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }
    if (typeof data.contact_name !== 'string' || data.contact_name.trim().length === 0) {
      return NextResponse.json({ error: 'Contact name is required' }, { status: 400 });
    }
    if (typeof data.email !== 'string' || !/^\S+@\S+\.\S+$/.test(data.email)) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }
    if (typeof data.phone !== 'string' || data.phone.trim().length === 0) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' '); // MySQL DATETIME format

    const insertSql = `
      INSERT INTO suppliers 
      (name, contact_name, phone, email, address, created_at) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result: any = await query(insertSql, [
      data.name,
      data.contact_name,
      data.phone,
      data.email,
      data.address,
      createdAt,
    ]);

    return NextResponse.json(
      { success: true, id: result.insertId, message: 'Supplier created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[v1] Suppliers POST error:', error);
    return NextResponse.json({ error: 'Failed to record supplier' }, { status: 500 });
  }
}
