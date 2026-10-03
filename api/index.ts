import express from 'express';
import dns from 'dns';

// Ensure IPv6/IPv4 lookup works in serverless environment
try {
  dns.setDefaultResultOrder('verbatim');
} catch {
  // Ignore in environments where setting lookup order is restricted
}

import { catalogRouter } from '../server/routes/catalog';
import { cartRouter } from '../server/routes/cart';
import { wishlistRouter } from '../server/routes/wishlist';
import { ordersRouter } from '../server/routes/orders';
import { adminRouter } from '../server/routes/admin';
import { systemRouter } from '../server/routes/system';
import { usersRouter } from '../server/routes/users';
import { initDatabaseSchema } from '../server/schema';
import { seedDatabase } from '../server/seed';

const app = express();

app.use(express.json());

// Lazy-initialize database schema and seed data on serverless cold-start
let isDbInitialized = false;

app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDatabaseSchema();
      await seedDatabase();
      isDbInitialized = true;
    } catch (err: any) {
      console.warn('Vercel DB initialization notice:', err.message);
    }
  }
  next();
});

// API Routes
app.use('/api', systemRouter);
app.use('/api', catalogRouter);
app.use('/api/cart', cartRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);

export default app;
