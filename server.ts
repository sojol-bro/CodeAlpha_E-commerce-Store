import dns from 'dns';
dns.setDefaultResultOrder('verbatim');

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { catalogRouter } from './server/routes/catalog';
import { cartRouter } from './server/routes/cart';
import { wishlistRouter } from './server/routes/wishlist';
import { ordersRouter } from './server/routes/orders';
import { adminRouter } from './server/routes/admin';
import { systemRouter } from './server/routes/system';
import { usersRouter } from './server/routes/users';
import { initDatabaseSchema } from './server/schema';
import { seedDatabase } from './server/seed';

const app = express();
const PORT = 3000;

app.use(express.json());

// API Routes
app.use('/api', systemRouter);
app.use('/api', catalogRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);

async function startServer() {
  // Ensure schema and seed data are populated on boot
  try {
    await initDatabaseSchema();
    await seedDatabase();
  } catch (err: any) {
    console.warn('Initial database init notice:', err.message);
  }

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MIO Server running on port ${PORT}`);
  });
}

startServer();
