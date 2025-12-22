import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Invitations ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching invitations (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Invitations');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { email, name, role, createdBy } = req.body;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await pool.request()
      .input('token', sql.NVarChar, token)
      .input('email', sql.NVarChar, email || '')
      .input('name', sql.NVarChar, name || '')
      .input('role', sql.NVarChar, role || 'STAFF')
      .input('status', sql.NVarChar, 'PENDING')
      .input('createdBy', sql.NVarChar, createdBy || '')
      .query(`
        INSERT INTO Invitations (token, email, name, role, status, createdBy)
        OUTPUT INSERTED.*
        VALUES (@token, @email, @name, @role, @status, @createdBy)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating invitation (DB failed), using fallback:', err.message || err);
    const { email, name, role, createdBy } = req.body;
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const rec = await fallbackStore.insert('Invitations', { token, email, name, role, status: 'PENDING', createdBy });
    return res.status(201).json(rec);
  }
});

export default router;
