import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Logs ORDER BY timestamp DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching logs (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Logs');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { action, details, userId, userName } = req.body;
    
    const result = await pool.request()
      .input('action', sql.NVarChar, action || '')
      .input('details', sql.NVarChar, details || '')
      .input('userId', sql.NVarChar, userId || '')
      .input('userName', sql.NVarChar, userName || '')
      .query(`
        INSERT INTO Logs (action, details, userId, userName)
        OUTPUT INSERTED.*
        VALUES (@action, @details, @userId, @userName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating log (DB failed), using fallback:', err.message || err);
    const { action, details, userId, userName } = req.body;
    const rec = await fallbackStore.insert('Logs', { action, details, userId, userName });
    return res.status(201).json(rec);
  }
});

export default router;
