import { Router } from 'express';
import {
  CategoryModel,
  ProductModel,
  ProductVariantModel,
  ProductImageModel,
  InventoryTransactionModel,
  AuditLogModel,
  ReviewModel,
  ShippingMethodModel,
  CouponModel,
} from '../models';

export const catalogRouter = Router();

catalogRouter.post('/products', async (req, res) => {
  try {
    // Authorization check: Only verified admin can add items to store
    const adminEmail = (req.headers['x-admin-email'] as string || '').toLowerCase().trim();
    const adminRole = (req.headers['x-admin-role'] as string || '').toLowerCase().trim();
    const isAdmin = adminEmail === 'sojolislam576@gmail.com' || adminRole === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        error: 'Access Denied: Only administrators and curators can add items to the catalog. Regular users cannot create products.'
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

    // Generate unique slug
    let slug = customSlug;
    if (!slug) {
      const baseSlug = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    // 1. Insert product into products table
    const product = await ProductModel.create({
      category_id: catId,
      title: String(title).trim(),
      slug,
      description: description ? String(description).trim() : 'Artisanal piece crafted by MIO Atelier.',
      brand: brand ? String(brand).trim() : 'MIO Atelier',
      base_price: isNaN(price) ? 500 : price,
      is_active: true,
    });

    // 2. Insert image into product_images table with image_url column
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

    // 3. Create initial variants
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

    // 4. Record audit log entry
    await AuditLogModel.log({
      action: 'PRODUCT_CREATED_WITH_STORAGE_IMAGE',
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
      message: 'Product silhouette and Supabase image recorded successfully.',
    });
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.get('/shipping-methods', async (req, res) => {
  try {
    const methods = await ShippingMethodModel.findAll(true);
    res.json({ methods });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.post('/coupons/validate', async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }
    const result = await CouponModel.validateCoupon(code, parseFloat(cartTotal || '0'));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.get('/categories', async (req, res) => {
  try {
    const categories = await CategoryModel.findAll(true);
    res.json({ categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.get('/products', async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const sort = req.query.sort ? String(req.query.sort) : 'newest';
    const limit = req.query.limit ? Math.min(100, parseInt(String(req.query.limit), 10)) : 24;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

    const result = await ProductModel.findAll({
      categoryId,
      search,
      sort,
      limit,
      offset,
      activeOnly: true,
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.get('/products/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await ProductModel.findBySlug(slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.get('/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const reviews = await ReviewModel.findByProductId(id);
    const summary = await ReviewModel.getAverageRating(id);
    res.json({ reviews, summary });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

catalogRouter.post('/products/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment, userName } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const review = await ReviewModel.create({
      product_id: id,
      rating: parseInt(rating, 10),
      title: title || 'Verified Connoisseur',
      comment: comment || '',
      is_verified_purchase: true,
      is_approved: true,
    });

    res.json({ review, userName: userName || 'Collector' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
