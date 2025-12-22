import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

// GET all suppliers
router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM Suppliers ORDER BY createdAt DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching suppliers (DB failed), using fallback:', err.message || err);
    const data = await fallbackStore.getAll('Suppliers');
    return res.json(data);
  }
});

// POST create new supplier
router.post('/', async (req, res) => {
  try {
    const pool = await getPool();
    const { name, contactPerson, email, phone, address, status, createdBy, createdByName } = req.body;
    
    // Generate unique ID
    const id = `supplier_${Date.now()}`;
    
    const result = await pool.request()
      .input('id', sql.NVarChar, id)
      .input('name', sql.NVarChar, name || 'Unknown Supplier')
      .input('contactPerson', sql.NVarChar, contactPerson || '')
      .input('email', sql.NVarChar, email || '')
      .input('phone', sql.NVarChar, phone || '')
      .input('address', sql.NVarChar, address || '')
      .input('status', sql.NVarChar, status || 'Active')
      .input('createdBy', sql.NVarChar, createdBy || '')
      .input('createdByName', sql.NVarChar, createdByName || '')
      .query(`
        INSERT INTO Suppliers (id, name, contactPerson, email, phone, address, status, createdBy, createdByName)
        OUTPUT INSERTED.*
        VALUES (@id, @name, @contactPerson, @email, @phone, @address, @status, @createdBy, @createdByName)
      `);
    
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    console.error('Error creating supplier (DB failed), using fallback:', err.message || err);
    const { name, contactPerson, email, phone, address, status, createdBy, createdByName } = req.body;
    const id = `supplier_${Date.now()}`;
    const rec = await fallbackStore.insert('Suppliers', { id, name, contactPerson, email, phone, address, status, createdBy, createdByName });
    return res.status(201).json(rec);
  }
});

export default router;
