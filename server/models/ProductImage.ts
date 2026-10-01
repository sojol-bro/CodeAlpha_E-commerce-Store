import { query } from '../db';

export interface ProductImageRow {
  id: string;
  product_id?: string | null;
  image_url: string;
  alt_text?: string | null;
  display_order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export class ProductImageModel {
  static async findByProductId(productId: string): Promise<ProductImageRow[]> {
    const res = await query<ProductImageRow>(
      'SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order ASC',
      [productId]
    );
    return res.rows;
  }

  static async create(data: Omit<ProductImageRow, 'id' | 'created_at'>): Promise<ProductImageRow> {
    if (data.is_primary && data.product_id) {
      await query('UPDATE product_images SET is_primary = false WHERE product_id = $1', [data.product_id]);
    }
    const res = await query<ProductImageRow>(
      `INSERT INTO product_images (product_id, image_url, alt_text, display_order, is_primary)
       VALUES ($1, $2, $3, COALESCE($4, 0), COALESCE($5, false))
       RETURNING *`,
      [
        data.product_id || null,
        data.image_url,
        data.alt_text || null,
        data.display_order ?? 0,
        data.is_primary ?? false,
      ]
    );
    return res.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM product_images WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
