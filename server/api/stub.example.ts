import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json([]);
});

router.post('/', (req, res) => {
  const item = { id: Date.now(), ...req.body };
  res.status(201).json(item);
});

export default router;
