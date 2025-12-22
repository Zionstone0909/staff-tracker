import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET stock movements (inventory history)
router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM StockMovements ORDER BY date DESC, createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching stock movements (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Inventory');
    return res.json(data);
  }
});

// POST stock movement (record a stock adjustment or movement)
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { productId, productName, type, quantity, reason, previousStock, newStock, date, userId, userName } = req.body;
    
    const result = await pool.request()
      .input('productId', sql.NVarChar, productId || '')
      .input('productName', sql.NVarChar, productName || '')
      .input('type', sql.NVarChar, type || 'CORRECTION')
      .input('quantity', sql.Int, quantity || 0)
      .input('reason', sql.NVarChar, reason || '')
      .input('previousStock', sql.Int, previousStock || 0)
      .input('newStock', sql.Int, newStock || 0)
      .input('date', sql.Date, date || new Date().toISOString().split('T')[0])
      .input('userId', sql.NVarChar, userId || '')
      .input('userName', sql.NVarChar, userName || '')
      .query(`
        INSERT INTO StockMovements (productId, productName, type, quantity, reason, previousStock, newStock, date, userId, userName)
        OUTPUT INSERTED.*
        VALUES (@productId, @productName, @type, @quantity, @reason, @previousStock, @newStock, @date, @userId, @userName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating stock movement (DB failed), using fallback:', err.message || err);
    const { productId, productName, type, quantity, reason, previousStock, newStock, date, userId, userName } = req.body;
    const rec = await fallbackStore.insert('Inventory', { productId, productName, type, quantity, reason, previousStock, newStock, date, userId, userName });
    return res.status(201).json(rec);
  }
});

export default router;
