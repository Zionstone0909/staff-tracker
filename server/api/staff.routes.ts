import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Staff ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching staff (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Staff');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { name, email, phone, position, salary, status, createdBy, createdByName } = req.body;
    const id = `staff_${Date.now()}`;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name || 'Unknown Staff')
      .input('email', sql.NVarChar, email || '')
      .input('phone', sql.NVarChar, phone || '')
      .input('position', sql.NVarChar, position || '')
      .input('salary', sql.Decimal(18, 2), salary || 0)
      .input('status', sql.NVarChar, status || 'Active')
      .input('createdBy', sql.NVarChar, createdBy || '')
      .input('createdByName', sql.NVarChar, createdByName || '')
      .query(`
        INSERT INTO Staff (id, name, email, phone, position, salary, status, createdBy, createdByName)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @email, @phone, @position, @salary, @status, @createdBy, @createdByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating staff (DB failed), using fallback:', err.message || err);
    const { name, email, phone, position, salary, status, createdBy, createdByName } = req.body;
    const id = `staff_${Date.now()}`;
    const rec = await fallbackStore.insert('Staff', { id, name, email, phone, position, salary, status, createdBy, createdByName });
    return res.status(201).json(rec);
  }
});

export default router;
