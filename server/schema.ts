import { query } from './db';

export async function initDatabaseSchema() {
  console.log('Initializing MIO PostgreSQL database schema...');

  const schemaStatements = [
    // 1. Notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 2. Shipping Methods
    `CREATE TABLE IF NOT EXISTS shipping_methods (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC(10, 2) NOT NULL,
      estimated_days_min INTEGER DEFAULT 1,
      estimated_days_max INTEGER DEFAULT 5,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 3. Coupons
    `CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      discount_type TEXT NOT NULL,
      discount_value NUMERIC(10, 2) NOT NULL,
      minimum_order_amount NUMERIC(10, 2) DEFAULT 0,
      maximum_discount NUMERIC(10, 2),
      usage_limit INTEGER,
      used_count INTEGER DEFAULT 0,
      start_date TIMESTAMP WITH TIME ZONE,
      expiry_date TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 4. Categories
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      slug TEXT,
      description TEXT,
      image_url TEXT,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 5. Products
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      category_id TEXT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      brand TEXT,
      base_price NUMERIC(10, 2) NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 6. Product Variants
    `CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      product_id TEXT,
      sku TEXT UNIQUE NOT NULL,
      size TEXT,
      color TEXT,
      price NUMERIC(10, 2) NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 7. Product Images
    `CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      product_id TEXT,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      display_order INTEGER DEFAULT 0,
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 8. Reviews
    `CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      product_id TEXT,
      user_id TEXT,
      rating INTEGER NOT NULL,
      title TEXT,
      comment TEXT,
      is_verified_purchase BOOLEAN DEFAULT false,
      is_approved BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 9. Inventory Transactions
    `CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      product_variant_id TEXT,
      transaction_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reference_id TEXT,
      note TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 10. Admin Audit Logs
    `CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      admin_user_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      old_data JSONB,
      new_data JSONB,
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 11. Users
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      phone TEXT,
      role TEXT DEFAULT 'customer',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 12. Addresses
    `CREATE TABLE IF NOT EXISTS addresses (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT,
      recipient_name TEXT,
      phone TEXT,
      address_line1 TEXT,
      address_line2 TEXT,
      city TEXT,
      district TEXT,
      postal_code TEXT,
      country TEXT,
      is_default BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 13. Carts
    `CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 14. Cart Items
    `CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      cart_id TEXT,
      product_variant_id TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 15. Wishlists
    `CREATE TABLE IF NOT EXISTS wishlists (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 16. Wishlist Items
    `CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      wishlist_id TEXT,
      product_id TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 17. Orders
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_number TEXT UNIQUE NOT NULL,
      user_id TEXT,
      shipping_address_id TEXT,
      status TEXT DEFAULT 'pending',
      subtotal NUMERIC(10, 2) NOT NULL,
      shipping_fee NUMERIC(10, 2) DEFAULT 0,
      total_amount NUMERIC(10, 2) NOT NULL,
      payment_status TEXT DEFAULT 'unpaid',
      ordered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 18. Order Items
    `CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_id TEXT,
      product_id TEXT,
      product_variant_id TEXT,
      product_name TEXT NOT NULL,
      sku TEXT,
      quantity INTEGER NOT NULL,
      unit_price NUMERIC(10, 2) NOT NULL,
      total_price NUMERIC(10, 2) NOT NULL,
      size TEXT,
      color TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 19. Payments
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_id TEXT,
      payment_method TEXT,
      payment_provider TEXT,
      transaction_id TEXT,
      amount NUMERIC(10, 2) NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'completed',
      paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 20. Shipments
    `CREATE TABLE IF NOT EXISTS shipments (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_id TEXT,
      shipping_method_id TEXT,
      tracking_number TEXT,
      carrier TEXT,
      status TEXT DEFAULT 'pending',
      shipped_at TIMESTAMP WITH TIME ZONE,
      delivered_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,

    // 21. Returns
    `CREATE TABLE IF NOT EXISTS returns (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      order_id TEXT,
      user_id TEXT,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'requested',
      refund_amount NUMERIC(10, 2),
      customer_note TEXT,
      admin_note TEXT,
      requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      approved_at TIMESTAMP WITH TIME ZONE,
      completed_at TIMESTAMP WITH TIME ZONE
    );`,

    // 22. Return Items
    `CREATE TABLE IF NOT EXISTS return_items (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      return_id TEXT,
      order_item_id TEXT,
      quantity INTEGER NOT NULL,
      reason TEXT,
      condition TEXT DEFAULT 'unopened'
    );`,
  ];

  for (const stmt of schemaStatements) {
    await query(stmt);
  }

  // Pre-seed admin user if allowed
  try {
    await query(`
      INSERT INTO users (email, full_name, role)
      VALUES ('sojolislam576@gmail.com', 'Sojol Islam (Head Curator)', 'admin')
      ON CONFLICT (email) DO NOTHING;
    `);
  } catch {
    // If Supabase foreign key constraint to auth.users is enforced, skip until auth creation
  }

  console.log('Database schema initialization complete.');
}
