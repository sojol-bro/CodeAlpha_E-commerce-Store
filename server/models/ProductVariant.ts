import { query } from '../db';

export interface ProductVariantRow {
  id: string;
  product_id?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  price?: number | string | null;
  stock_quantity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class ProductVariantModel {
  static async findById(id: string): Promise<ProductVariantRow | null> {
    const res = await query<ProductVariantRow>('SELECT * FROM product_variants WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByProductId(productId: string): Promise<ProductVariantRow[]> {
    const res = await query<ProductVariantRow>(
      'SELECT * FROM product_variants WHERE product_id = $1 AND is_active = true ORDER BY price ASC',
      [productId]
    );
    return res.rows;
  }

  static async create(data: Omit<ProductVariantRow, 'id' | 'created_at' | 'updated_at'>): Promise<ProductVariantRow> {
    const res = await query<ProductVariantRow>(
      `INSERT INTO product_variants (product_id, sku, size, color, price, stock_quantity, is_active)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 0), COALESCE($7, true))
       RETURNING *`,
      [
        data.product_id || null,
        data.sku || null,
        data.size || null,
        data.color || null,
        data.price ?? null,
        data.stock_quantity ?? 0,
        data.is_active ?? true,
      ]
    );
    return res.rows[0];
  }

  static async updateStock(id: string, delta: number): Promise<ProductVariantRow | null> {
    const res = await query<ProductVariantRow>(
      `UPDATE product_variants
       SET stock_quantity = GREATEST(0, stock_quantity + $2),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, delta]
    );
    return res.rows[0] || null;
  }

  static async update(id: string, data: Partial<ProductVariantRow>): Promise<ProductVariantRow | null> {
    const res = await query<ProductVariantRow>(
      `UPDATE product_variants
       SET sku = COALESCE($2, sku),
           size = COALESCE($3, size),
           color = COALESCE($4, color),
           price = COALESCE($5, price),
           stock_quantity = COALESCE($6, stock_quantity),
           is_active = COALESCE($7, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        id,
        data.sku || null,
        data.size || null,
        data.color || null,
        data.price ?? null,
        data.stock_quantity ?? null,
        data.is_active ?? null,
      ]
    );
    return res.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM product_variants WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
