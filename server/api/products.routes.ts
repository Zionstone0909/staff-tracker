import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Products ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching products (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Products');
    return res.json(data);
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { name, sku, description, category, price, cost, quantity, reorderLevel, supplier, createdBy, createdByName } = req.body;
    const id = `product_${Date.now()}`;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name || 'Unknown Product')
      .input('sku', sql.NVarChar, sku || '')
      .input('description', sql.NVarChar, description || '')
      .input('category', sql.NVarChar, category || '')
      .input('price', sql.Decimal(18, 2), price || 0)
      .input('cost', sql.Decimal(18, 2), cost || 0)
      .input('quantity', sql.Int, quantity || 0)
      .input('reorderLevel', sql.Int, reorderLevel || 10)
      .input('supplier', sql.NVarChar, supplier || '')
      .input('createdBy', sql.NVarChar, createdBy || '')
      .input('createdByName', sql.NVarChar, createdByName || '')
      .query(`
        INSERT INTO Products (id, name, sku, description, category, price, cost, quantity, reorderLevel, supplier, createdBy, createdByName)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @sku, @description, @category, @price, @cost, @quantity, @reorderLevel, @supplier, @createdBy, @createdByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating product (DB failed), using fallback:', err.message || err);
    const { name, sku, description, category, price, cost, quantity, reorderLevel, supplier, createdBy, createdByName } = req.body;
    const id = `product_${Date.now()}`;
    const rec = await fallbackStore.insert('Products', { id, name, sku, description, category, price, cost, quantity, reorderLevel, supplier, createdBy, createdByName });
    return res.status(201).json(rec);
  }
});

export default router;
