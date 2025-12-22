import { Router } from 'express';
import { getPool, sql } from '../db.ts';
import fallbackStore from '../fallbackStore.ts';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const pool = await getPool();
    
    // Fetch logs ordered by timestamp desc
    const logsResult = await pool.request()
      .query('SELECT id, action, details, userId, userName, timestamp as createdAt FROM Logs ORDER BY timestamp DESC');
    
    // Fetch stock movements
    const stockResult = await pool.request()
      .query('SELECT id, productName, quantity, type as status, reason as description, userName, createdAt FROM StockMovements ORDER BY createdAt DESC');
    
    // Combine and sort by date
    const combined = [
      ...logsResult.recordset.map(r => ({ ...r, type: "Logs", timestamp: r.createdAt })),
      ...stockResult.recordset.map(r => ({ ...r, type: "StockMovement", timestamp: r.createdAt }))
    ].sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime())
      .slice(0, 100); // Limit to last 100 activities
    
    res.json(combined);
  } catch (err) {
    console.error('Error fetching activity feed (DB failed), using fallback:', err.message || err);
    
    // Fallback: combine logs and stock movements from file store
    const logs = await fallbackStore.getAll('Logs');
    const stockMovements = await fallbackStore.getAll('StockMovements');
    
    const combined = [
      ...logs.map(r => ({ ...r, type: 'Logs', timestamp: r.timestamp || r.createdAt })),
      ...stockMovements.map(r => ({ ...r, type: 'StockMovement', timestamp: r.createdAt }))
    ].sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime())
      .slice(0, 100);
    
    return res.json(combined);
  }
});

export default router;
