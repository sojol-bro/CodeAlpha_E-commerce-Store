import { Router } from 'express';
import { testConnection } from '../db';
import { seedDatabase } from '../seed';
import { initDatabaseSchema } from '../schema';
import { AddressModel } from '../models';

export const systemRouter = Router();

systemRouter.get('/health', async (req, res) => {
  const dbTest = await testConnection();
  res.json({
    status: 'ok',
    app: 'MIO Luxury Platform',
    version: '1.0.0',
    database: dbTest,
    timestamp: new Date().toISOString(),
  });
});

systemRouter.post('/seed', async (req, res) => {
  try {
    await initDatabaseSchema();
    await seedDatabase();
    res.json({ success: true, message: 'Database topography seeded successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

systemRouter.get('/addresses', async (req, res) => {
  try {
    const userId = req.query.userId ? String(req.query.userId) : 'guest';
    const addresses = await AddressModel.findByUserId(userId);
    res.json({ addresses });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

systemRouter.get('/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.VITE_SUPABASE_URL || 'https://jfwjitqutdbueaxxxwld.supabase.co',
    hasAnonKey: Boolean(process.env.VITE_SUPABASE_ANON_KEY),
  });
});
