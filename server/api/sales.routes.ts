import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Sales ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching sales (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Sales');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { customerId, customerName, total, amountPaid, paymentMethod, date, items, notes, initiatedBy, initiatedByName } = req.body;
    const id = `sale_${Date.now()}`;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('customerId', sql.NVarChar, customerId || '')
      .input('customerName', sql.NVarChar, customerName || '')
      .input('total', sql.Decimal(18, 2), total || 0)
      .input('amountPaid', sql.Decimal(18, 2), amountPaid || 0)
      .input('paymentMethod', sql.NVarChar, paymentMethod || '')
      .input('date', sql.Date, date || new Date())
      .input('items', sql.NVarChar, JSON.stringify(items || []))
      .input('notes', sql.NVarChar, notes || '')
      .input('initiatedBy', sql.NVarChar, initiatedBy || '')
      .input('initiatedByName', sql.NVarChar, initiatedByName || '')
      .query(`
        INSERT INTO Sales (id, customerId, customerName, total, amountPaid, paymentMethod, date, items, notes, initiatedBy, initiatedByName)
        OUTPUT INSERTED.*
        VALUES (@id, @customerId, @customerName, @total, @amountPaid, @paymentMethod, @date, @items, @notes, @initiatedBy, @initiatedByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating sale (DB failed), using fallback:', err.message || err);
    const { customerId, customerName, total, amountPaid, paymentMethod, date, items, notes, initiatedBy, initiatedByName } = req.body;
    const id = `sale_${Date.now()}`;
    const rec = await fallbackStore.insert('Sales', { id, customerId, customerName, total, amountPaid, paymentMethod, date, items, notes, initiatedBy, initiatedByName });
    return res.status(201).json(rec);
  }
});

export default router;
