import { Router, Request, Response } from 'express';
import { getPool, sql } from '../../db.ts';
import fallbackStore from '../../fallbackStore.ts';
import { ClientExpense } from './expenses.types.ts';

const router = Router();

// ----------------------------
// POST /api/expenses (Corrected for Data Safety and Enhanced Error Logging)
// ----------------------------
router.post('/', async (req: Request, res: Response) => {
  const body: ClientExpense = req.body;
  
  // Destructure required and optional fields for clarity
  const {
    description, amount, date, category,
    type, status, paymentMethod, reference, supplierId, recordedByName
  } = body;

  // 1. Core Validation Check
  if (!description || !amount || !date || !category) {
    return res.status(400).json({ error: 'Missing required fields: description, amount, date, or category.' });
  }
  
  // Basic sanity check for amount
  if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be a positive number.' });
  }

  // 2. Safe Value Handling for Optional Fields (CRITICAL for SQL NOT NULL avoidance)
  // Ensure that if these fields are null/undefined/empty string from the client, 
  // they are explicitly set to null for the SQL query.
  const expenseType = type || 'EXPENSE';
  const referenceValue = reference || null;
  const supplierIdValue = supplierId || null;
  const paymentMethodValue = paymentMethod || 'Cash';
  const statusValue = status || 'Paid';
  const recordedByNameValue = recordedByName || 'System';

  try {
    const pool = await getPool();
    const request = pool.request();

    // 3. Input Binding
    request.input('type', sql.VarChar(20), expenseType);
    request.input('category', sql.VarChar(50), category);
    request.input('description', sql.NVarChar(255), description);
    
    request.input('reference', sql.NVarChar(100), referenceValue); 
    request.input('supplierId', sql.NVarChar(50), supplierIdValue); 

    request.input('amount', sql.Decimal(18, 2), amount); // Ensure this matches your DB schema
    request.input('paymentMethod', sql.VarChar(50), paymentMethodValue);
    request.input('status', sql.VarChar(20), statusValue);
    request.input('date', sql.Date, date);
    request.input('recordedByName', sql.NVarChar(100), recordedByNameValue);

    // 4. Execute Query
    const result = await request.query(`
      INSERT INTO Expenses (
        type, category, description, reference, amount,
        paymentMethod, status, supplierId, [date], recordedByName, createdAt
      )
      OUTPUT inserted.*
      VALUES (
        @type, @category, @description, @reference, @amount,
        @paymentMethod, @status, @supplierId, @date, @recordedByName, GETDATE()
      )
    `);

    // Success
    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    // 5. CRITICAL LOGGING: This will show the real SQL error (e.g., ID auto-increment missing)
    console.error('--- SQL INSERT Error Details ---');
    console.error('Data being inserted:', body);
    console.error('Error Message:', err.message);
    console.error('Falling back to file store');
    console.error('------------------------------');

    // Fallback to file store
    try {
      const {
        description, amount, date, category,
        type, status, paymentMethod, reference, supplierId, recordedByName
      } = body;
      const rec = await fallbackStore.insert('Expenses', {
        type: type || 'EXPENSE',
        category,
        description,
        reference: reference || null,
        amount,
        paymentMethod: paymentMethod || 'Cash',
        status: status || 'Paid',
        supplierId: supplierId || null,
        date,
        recordedByName: recordedByName || 'System'
      });
      return res.status(201).json(rec);
    } catch (fallbackErr: any) {
      console.error('Fallback store also failed:', fallbackErr);
      res.status(500).json({ error: 'Failed to save expense due to a database error. Please check the server console for specific details.' });
    }
  }
});

// ----------------------------
// GET /api/expenses (Cleaned and Filter-Ready)
// ----------------------------
// GET /api/expenses (Cleaned and Filter-Ready)
// ----------------------------
router.get('/', async (req: Request, res: Response) => {
  const searchTerm = (req.query.search as string) || '';
  const categoryFilter = (req.query.category as string) || 'All';
  const searchParam = `%${searchTerm}%`;

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('search', sql.NVarChar, searchParam);
    request.input('category', sql.VarChar(50), categoryFilter);

    let whereClause = `(description LIKE @search OR reference LIKE @search)`;
    
    // Add category filter dynamically if it's not 'All'
    if (categoryFilter !== 'All') {
        whereClause += ` AND category = @category`;
    }

    const result = await request.query(`
      SELECT * FROM Expenses
      WHERE ${whereClause}
      ORDER BY [date] DESC, createdAt DESC
    `);

    res.json(result.recordset);
  } catch (err: any) {
    console.error('SQL GET Error:', err);
    console.error('Falling back to file store');
    try {
      const data = await fallbackStore.getAll('Expenses');
      // Apply basic filtering if needed
      if (searchTerm || categoryFilter !== 'All') {
        return res.json(data.filter((item: any) => {
          const matchSearch = !searchTerm || item.description?.includes(searchTerm) || item.reference?.includes(searchTerm);
          const matchCategory = categoryFilter === 'All' || item.category === categoryFilter;
          return matchSearch && matchCategory;
        }));
      }
      return res.json(data);
    } catch (fallbackErr: any) {
      console.error('Fallback store also failed:', fallbackErr);
      res.status(500).json({ error: 'Failed to load expenses. Try again.' });
    }
  }
});

export default router;