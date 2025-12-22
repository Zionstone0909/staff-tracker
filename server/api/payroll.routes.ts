import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Payroll ORDER BY paymentDate DESC, createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching payroll (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Payroll');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { staffId, staffName, department, amount, paymentDate, periodStart, periodEnd, processedBy, processedByName } = req.body;
    
    const result = await pool.request()
      .input('staffName', sql.NVarChar, staffName || '')
      .input('department', sql.NVarChar, department || '')
      .input('amount', sql.Decimal(18, 2), amount || 0)
      .input('paymentDate', sql.Date, paymentDate || new Date().toISOString().split('T')[0])
      .input('processedBy', sql.NVarChar, processedBy || '')
      .input('processedByName', sql.NVarChar, processedByName || '')
      .query(`
        INSERT INTO Payroll (staffName, department, amount, paymentDate, processedBy, processedByName)
        OUTPUT INSERTED.*
        VALUES (@staffName, @department, @amount, @paymentDate, @processedBy, @processedByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating payroll (DB failed), using fallback:', err.message || err);
    const { staffId, staffName, department, amount, paymentDate, periodStart, periodEnd, processedBy, processedByName } = req.body;
    const rec = await fallbackStore.insert('Payroll', { staffName, department, amount, paymentDate, processedBy, processedByName });
    return res.status(201).json(rec);
  }
});

export default router;
