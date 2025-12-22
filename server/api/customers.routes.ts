import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Customers ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching customers (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Customers');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { name, email, phone, address, createdBy, createdByName } = req.body;
    const id = `customer_${Date.now()}`;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name || 'Unknown Customer')
      .input('email', sql.NVarChar, email || '')
      .input('phone', sql.NVarChar, phone || '')
      .input('address', sql.NVarChar, address || '')
      .input('createdBy', sql.NVarChar, createdBy || '')
      .input('createdByName', sql.NVarChar, createdByName || '')
      .query(`
        INSERT INTO Customers (id, name, email, phone, address, createdBy, createdByName)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @email, @phone, @address, @createdBy, @createdByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating customer (DB failed), using fallback:', err.message || err);
    const { name, email, phone, address, createdBy, createdByName } = req.body;
    const id = `customer_${Date.now()}`;
    const rec = await fallbackStore.insert('Customers', { id, name, email, phone, address, createdBy, createdByName });
    return res.status(201).json(rec);
  }
});

export default router;
