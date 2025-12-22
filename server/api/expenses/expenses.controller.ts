import { Request, Response } from 'express';
import { sql, getPool } from '../../db.ts';
import { ClientExpense } from './expenses.types.ts';

export const createExpense = async (
  req: Request<{}, {}, ClientExpense>,
  res: Response
) => {
  const {
    description,
    amount,
    date,
    category,
    reference = null,
    paymentMethod = 'Cash',
    status = 'Paid',
    supplierId = null,
    recordedByName = 'System'
  } = req.body;

  if (!description || !amount || !date || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const pool = await getPool();
    const request = pool.request();

    request.input('type', sql.VarChar(20), 'EXPENSE');
    request.input('category', sql.VarChar(50), category);
    request.input('description', sql.NVarChar(255), description);
    request.input('reference', sql.NVarChar(100), reference);
    request.input('amount', sql.Decimal(18, 2), amount);
    request.input('paymentMethod', sql.VarChar(50), paymentMethod);
    request.input('status', sql.VarChar(20), status);
    request.input('supplierId', sql.NVarChar(50), supplierId);
    request.input('date', sql.Date, date);
    request.input('recordedByName', sql.NVarChar(100), recordedByName);

    const result = await request.query(`
      INSERT INTO Expenses (
        type, category, description, reference, amount,
        paymentMethod, status, supplierId,
        [date], recordedByName, createdAt
      )
      OUTPUT inserted.*
      VALUES (
        @type, @category, @description, @reference, @amount,
        @paymentMethod, @status, @supplierId,
        @date, @recordedByName, GETDATE()
      )
    `);

    res.status(201).json(result.recordset[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  const search = `%${req.query.search || ''}%`;

  try {
    const pool = await getPool();
    const request = pool.request();
    request.input('search', sql.NVarChar, search);

    const result = await request.query(`
      SELECT *
      FROM Expenses
      WHERE type = 'EXPENSE'
        AND (description LIKE @search OR reference LIKE @search)
      ORDER BY [date] DESC, createdAt DESC
    `);

    res.json(result.recordset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
