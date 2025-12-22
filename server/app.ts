import express from 'express';
import cors from 'cors';

import expenseRoutes from './api/expenses/expenses.routes.ts';

const app = express();

// --------------------------------------------------
// Middleware
// --------------------------------------------------
app.use(cors());
app.use(express.json());

// --------------------------------------------------
// Health Check (optional but recommended)
// --------------------------------------------------
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'OK' });
});

// --------------------------------------------------
// API Routes
// --------------------------------------------------
app.use('/api/expenses', expenseRoutes);

// --------------------------------------------------
// 404 Handler
// --------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
