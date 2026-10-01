import { Router } from 'express';
import {
  OrderModel,
  ProductModel,
  ProductVariantModel,
  ProductImageModel,
  InventoryTransactionModel,
  AuditLogModel,
  CouponModel,
  ShipmentModel,
} from '../models';
import { query, testConnection } from '../db';

export const adminRouter = Router();

adminRouter.post('/products', async (req, res) => {
  try {
    const adminEmail = (req.headers['x-admin-email'] as string || '').toLowerCase().trim();
    const adminRole = (req.headers['x-admin-role'] as string || '').toLowerCase().trim();
    const isAdmin = adminEmail === 'sojolislam576@gmail.com' || adminRole === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Forbidden: Admin access required to add products to the catalog.'
      });
    }

    const {
      title,
      slug: customSlug,
      categoryId,
      category_id,
      description,
      brand,
      basePrice,
      base_price,
      imageUrl,
      image_url,
      altText,
      alt_text,
      variants,
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const price = parseFloat(String(basePrice ?? base_price ?? '500'));
    const catId = categoryId || category_id || null;

    let slug = customSlug;
    if (!slug) {
      const baseSlug = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await ProductModel.create({
      category_id: catId,
      title: String(title).trim(),
      slug,
      description: description ? String(description).trim() : 'Artisanal piece crafted by MIO Atelier.',
      brand: brand ? String(brand).trim() : 'MIO Atelier',
      base_price: isNaN(price) ? 500 : price,
      is_active: true,
    });

    const finalImageUrl = imageUrl || image_url;
    let createdImage = null;
    if (finalImageUrl) {
      createdImage = await ProductImageModel.create({
        product_id: product.id,
        image_url: String(finalImageUrl).trim(),
        alt_text: altText || alt_text || product.title,
        display_order: 0,
        is_primary: true,
      });
    }

    const createdVariants = [];
    if (Array.isArray(variants) && variants.length > 0) {
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vSku = v.sku || `MIO-${slug.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-3)}-${i + 1}`;
        const vVariant = await ProductVariantModel.create({
          product_id: product.id,
          sku: vSku,
          size: v.size || 'Standard',
          color: v.color || 'Signature Atelier',
          price: v.price ? parseFloat(String(v.price)) : (isNaN(price) ? 500 : price),
          stock_quantity: v.stockQuantity ?? v.stock_quantity ?? 12,
          is_active: true,
        });
        createdVariants.push(vVariant);

        await InventoryTransactionModel.create({
          product_variant_id: vVariant.id,
          transaction_type: 'restock',
          quantity: vVariant.stock_quantity || 12,
          note: 'Initial atelier release',
        });
      }
    } else {
      const defaultSku = `MIO-${slug.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const defaultVariant = await ProductVariantModel.create({
        product_id: product.id,
        sku: defaultSku,
        size: 'Standard',
        color: 'Signature Atelier',
        price: isNaN(price) ? 500 : price,
        stock_quantity: 12,
        is_active: true,
      });
      createdVariants.push(defaultVariant);

      await InventoryTransactionModel.create({
        product_variant_id: defaultVariant.id,
        transaction_type: 'restock',
        quantity: 12,
        note: 'Initial atelier release',
      });
    }

    await AuditLogModel.log({
      action: 'ADMIN_PRODUCT_CREATED_WITH_STORAGE_IMAGE',
      entity_type: 'PRODUCT',
      entity_id: product.id,
      new_data: {
        title: product.title,
        price,
        image_url: finalImageUrl,
        product_images_id: createdImage?.id,
        variants_count: createdVariants.length,
      },
    });

    const fullProduct = await ProductModel.findById(product.id);
    res.status(201).json({
      success: true,
      product: fullProduct,
      message: 'Product silhouette and Supabase image recorded successfully in atelier archive.',
    });
  } catch (err: any) {
    console.error('Error creating product in admin:', err);
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/overview', async (req, res) => {
  try {
    const ordersRes = await query(`
      SELECT 
        COUNT(*)::int as total_orders,
        COALESCE(SUM(total_amount), 0)::float as total_revenue,
        COUNT(CASE WHEN status = 'confirmed' OR status = 'pending' THEN 1 END)::int as pending_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::int as delivered_orders
      FROM orders
    `);

    const productsRes = await query(`
      SELECT 
        COUNT(DISTINCT p.id)::int as total_products,
        COUNT(pv.id)::int as total_variants,
        COALESCE(SUM(pv.stock_quantity), 0)::int as total_units_in_stock
      FROM products p
      LEFT JOIN product_variants pv ON pv.product_id = p.id
    `);

    const recentOrders = await OrderModel.findAll(10);
    const recentAudit = await AuditLogModel.findAll(10);

    res.json({
      metrics: {
        ...ordersRes.rows[0],
        ...productsRes.rows[0],
      },
      recentOrders,
      recentAudit,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/orders', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const orders = await OrderModel.findAll(limit);
    res.json({ orders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, shipmentStatus } = req.body;

    const updated = await OrderModel.updateStatus(id, status, paymentStatus);

    if (shipmentStatus) {
      const shipments = await ShipmentModel.findByOrderId(id);
      if (shipments.length > 0) {
        await ShipmentModel.updateStatus(shipments[0].id, shipmentStatus);
      }
    }

    await AuditLogModel.log({
      action: 'ORDER_STATUS_UPDATED',
      entity_type: 'ORDER',
      entity_id: id,
      new_data: { status, paymentStatus, shipmentStatus },
    });

    const refreshed = await OrderModel.findById(id);
    res.json({ order: refreshed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/inventory', async (req, res) => {
  try {
    const transactions = await InventoryTransactionModel.findAll(50);
    const variantStock = await query(`
      SELECT 
        pv.id,
        pv.sku,
        pv.size,
        pv.color,
        pv.stock_quantity,
        pv.price,
        p.title as product_title,
        p.brand
      FROM product_variants pv
      JOIN products p ON p.id = pv.product_id
      ORDER BY pv.stock_quantity ASC, p.title ASC
    `);

    res.json({
      transactions,
      stockLedger: variantStock.rows,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/inventory/adjust', async (req, res) => {
  try {
    const { variantId, adjustmentQuantity, reason } = req.body;
    if (!variantId || adjustmentQuantity === undefined) {
      return res.status(400).json({ error: 'variantId and adjustmentQuantity are required' });
    }

    const qty = parseInt(String(adjustmentQuantity), 10);
    const updatedVariant = await ProductVariantModel.updateStock(variantId, qty);

    await InventoryTransactionModel.create({
      product_variant_id: variantId,
      transaction_type: qty > 0 ? 'restock' : 'adjustment',
      quantity: qty,
      note: reason || 'Manual Atelier stock ledger reconciliation',
    });

    await AuditLogModel.log({
      action: 'INVENTORY_MANUAL_ADJUSTMENT',
      entity_type: 'PRODUCT_VARIANT',
      entity_id: variantId,
      new_data: { delta: qty, newStock: updatedVariant?.stock_quantity, reason },
    });

    res.json({ success: true, variant: updatedVariant });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLogModel.findAll(50);
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



adminRouter.get('/coupons', async (req, res) => {
  try {
    const coupons = await CouponModel.findAll();
    res.json({ coupons });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/coupons', async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrder, maxDiscount, usageLimit } = req.body;
    if (!code || !discountValue) {
      return res.status(400).json({ error: 'Code and discount value are required' });
    }
    const coupon = await CouponModel.create({
      code,
      description,
      discount_type: discountType || 'percentage',
      discount_value: parseFloat(discountValue),
      minimum_order_amount: minOrder ? parseFloat(minOrder) : undefined,
      maximum_discount: maxDiscount ? parseFloat(maxDiscount) : undefined,
      usage_limit: usageLimit ? parseInt(usageLimit, 10) : undefined,
      is_active: true,
    });
    res.json({ coupon });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch('/coupons/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = await CouponModel.toggleActive(id, typeof isActive === 'boolean' ? isActive : undefined);
    if (!updated) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    await AuditLogModel.log({
      action: 'COUPON_TOGGLED',
      entity_type: 'COUPON',
      entity_id: id,
      new_data: { is_active: updated.is_active, code: updated.code },
    });
    res.json({ coupon: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Database Topography Status & Verification for all 22 required tables
adminRouter.get('/database-stats', async (req, res) => {
  try {
    const conn = await testConnection();

    const requiredTables = [
      'users',
      'addresses',
      'categories',
      'products',
      'product_variants',
      'product_images',
      'reviews',
      'carts',
      'cart_items',
      'wishlists',
      'wishlist_items',
      'orders',
      'order_items',
      'payments',
      'shipping_methods',
      'shipments',
      'returns',
      'return_items',
      'inventory_transactions',
      'coupons',
      'admin_audit_logs',
      'notifications',
    ];

    const tableCounts: Record<string, number> = {};

    for (const t of requiredTables) {
      try {
        const countRes = await query(`SELECT COUNT(*)::int as count FROM "${t}"`);
        tableCounts[t] = countRes.rows[0]?.count ?? 0;
      } catch (tableErr: any) {
        tableCounts[t] = -1;
      }
    }

    res.json({
      connected: conn.connected,
      latencyMs: conn.latencyMs,
      databaseEngine: 'PostgreSQL (Supabase)',
      requiredTablesCount: 22,
      tablesReport: tableCounts,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
