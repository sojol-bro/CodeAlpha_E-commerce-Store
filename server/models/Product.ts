import { query } from '../db';
import { ProductVariantRow } from './ProductVariant';
import { ProductImageRow } from './ProductImage';

export interface ProductRow {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  base_price: number | string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  variants?: ProductVariantRow[];
  images?: ProductImageRow[];
  rating_avg?: number;
  rating_count?: number;
}

export class ProductModel {
  static async findAll(params: {
    categoryId?: string;
    search?: string;
    sort?: string;
    limit?: number;
    offset?: number;
    activeOnly?: boolean;
  } = {}): Promise<{ products: ProductRow[]; total: number }> {
    const { categoryId, search, sort = 'newest', limit = 24, offset = 0, activeOnly = true } = params;
    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (activeOnly) {
      conditions.push(`p.is_active = true`);
    }

    if (categoryId) {
      conditions.push(`p.category_id = $${idx++}`);
      values.push(categoryId);
    }

    if (search) {
      conditions.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR p.brand ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let orderBy = 'p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'p.base_price ASC';
    if (sort === 'price_desc') orderBy = 'p.base_price DESC';
    if (sort === 'rating') orderBy = 'COALESCE(AVG(r.rating), 0) DESC, p.created_at DESC';
    if (sort === 'title') orderBy = 'p.title ASC';

    const countSql = `
      SELECT COUNT(DISTINCT p.id)::int as total
      FROM products p
      ${whereClause}
    `;
    const countRes = await query<{ total: number }>(countSql, values);
    const total = countRes.rows[0]?.total || 0;

    const dataSql = `
      SELECT 
        p.*,
        c.name as category_name,
        ROUND(COALESCE(AVG(r.rating), 5.0)::numeric, 1)::float as rating_avg,
        COUNT(DISTINCT r.id)::int as rating_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      ${whereClause}
      GROUP BY p.id, c.name
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(limit, offset);
    const dataRes = await query<ProductRow>(dataSql, values);

    // Fetch primary images & variants for these products
    if (dataRes.rows.length > 0) {
      const pIds = dataRes.rows.map(p => p.id);
      const imgRes = await query<ProductImageRow>(
        `SELECT * FROM product_images WHERE product_id = ANY($1) ORDER BY display_order ASC`,
        [pIds]
      );
      const varRes = await query<ProductVariantRow>(
        `SELECT * FROM product_variants WHERE product_id = ANY($1) AND is_active = true ORDER BY price ASC`,
        [pIds]
      );

      const imagesByPid = new Map<string, ProductImageRow[]>();
      imgRes.rows.forEach(img => {
        if (!imagesByPid.has(img.product_id!)) imagesByPid.set(img.product_id!, []);
        imagesByPid.get(img.product_id!)!.push(img);
      });

      const variantsByPid = new Map<string, ProductVariantRow[]>();
      varRes.rows.forEach(v => {
        if (!variantsByPid.has(v.product_id!)) variantsByPid.set(v.product_id!, []);
        variantsByPid.get(v.product_id!)!.push(v);
      });

      dataRes.rows.forEach(p => {
        p.images = imagesByPid.get(p.id) || [];
        p.variants = variantsByPid.get(p.id) || [];
      });
    }

    return { products: dataRes.rows, total };
  }

  static async findById(id: string): Promise<ProductRow | null> {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        ROUND(COALESCE(AVG(r.rating), 5.0)::numeric, 1)::float as rating_avg,
        COUNT(DISTINCT r.id)::int as rating_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      WHERE p.id = $1
      GROUP BY p.id, c.name
    `;
    const res = await query<ProductRow>(sql, [id]);
    if (res.rows.length === 0) return null;
    const product = res.rows[0];

    const imgRes = await query<ProductImageRow>(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order ASC',
      [id]
    );
    const varRes = await query<ProductVariantRow>(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY price ASC',
      [id]
    );
    product.images = imgRes.rows;
    product.variants = varRes.rows;
    return product;
  }

  static async findBySlug(slug: string): Promise<ProductRow | null> {
    const sql = `
      SELECT 
        p.*,
        c.name as category_name,
        ROUND(COALESCE(AVG(r.rating), 5.0)::numeric, 1)::float as rating_avg,
        COUNT(DISTINCT r.id)::int as rating_count
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      WHERE p.slug = $1
      GROUP BY p.id, c.name
    `;
    const res = await query<ProductRow>(sql, [slug]);
    if (res.rows.length === 0) return null;
    const product = res.rows[0];

    const imgRes = await query<ProductImageRow>(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order ASC',
      [product.id]
    );
    const varRes = await query<ProductVariantRow>(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY price ASC',
      [product.id]
    );
    product.images = imgRes.rows;
    product.variants = varRes.rows;
    return product;
  }

  static async create(data: {
    category_id?: string;
    title: string;
    slug: string;
    description?: string;
    brand?: string;
    base_price: number;
    is_active?: boolean;
  }): Promise<ProductRow> {
    const res = await query<ProductRow>(
      `INSERT INTO products (category_id, title, slug, description, brand, base_price, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, true))
       RETURNING *`,
      [
        data.category_id || null,
        data.title,
        data.slug,
        data.description || null,
        data.brand || null,
        data.base_price,
        data.is_active ?? true,
      ]
    );
    return res.rows[0];
  }

  static async update(id: string, data: Partial<ProductRow>): Promise<ProductRow | null> {
    const res = await query<ProductRow>(
      `UPDATE products
       SET category_id = COALESCE($2, category_id),
           title = COALESCE($3, title),
           slug = COALESCE($4, slug),
           description = COALESCE($5, description),
           brand = COALESCE($6, brand),
           base_price = COALESCE($7, base_price),
           is_active = COALESCE($8, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.category_id || null,
        data.title || null,
        data.slug || null,
        data.description || null,
        data.brand || null,
        data.base_price || null,
        data.is_active ?? null,
      ]
    );
    return res.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM products WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
