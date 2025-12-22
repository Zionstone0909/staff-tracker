import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM SupplierTransactions ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching supplier transactions (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('SupplierTransactions');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { supplierId, supplierName, type, amount, description, reference, date, initiatedBy, initiatedByName } = req.body;
    
    const result = await pool.request()
      .input('supplierId', sql.NVarChar, supplierId || '')
      .input('supplierName', sql.NVarChar, supplierName || '')
      .input('type', sql.NVarChar, type || 'SUPPLY')
      .input('amount', sql.Decimal(18, 2), amount || 0)
      .input('description', sql.NVarChar, description || '')
      .input('reference', sql.NVarChar, reference || '')
      .input('date', sql.Date, date ? new Date(date) : new Date())
      .input('initiatedBy', sql.NVarChar, initiatedBy || '')
      .input('initiatedByName', sql.NVarChar, initiatedByName || '')
      .query(`
        INSERT INTO SupplierTransactions (supplierId, supplierName, type, amount, description, reference, date, initiatedBy, initiatedByName)
        OUTPUT INSERTED.*
        VALUES (@supplierId, @supplierName, @type, @amount, @description, @reference, @date, @initiatedBy, @initiatedByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating supplier transaction (DB failed), using fallback:', err.message || err);
    const { supplierId, supplierName, type, amount, description, reference, date, initiatedBy, initiatedByName } = req.body;
    const rec = await fallbackStore.insert('SupplierTransactions', { supplierId, supplierName, type, amount, description, reference, date: date || new Date().toISOString().split('T')[0], initiatedBy, initiatedByName });
    return res.status(201).json(rec);
  }
});

export default router;
