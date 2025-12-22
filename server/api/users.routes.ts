import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Users ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching users (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Users');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { id, name, email, role, isActive } = req.body;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id || `user_${Date.now()}`)
      .input('name', sql.NVarChar, name || 'Unknown User')
      .input('email', sql.NVarChar, email || '')
      .input('role', sql.NVarChar, role || 'STAFF')
      .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
      .query(`
        INSERT INTO Users (id, name, email, role, isActive)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @email, @role, @isActive)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating user (DB failed), using fallback:', err.message || err);
    const { id, name, email, role, isActive } = req.body;
    const rec = await fallbackStore.insert('Users', { id: id || `user_${Date.now()}`, name, email, role, isActive });
    return res.status(201).json(rec);
  }
});

export default router;
