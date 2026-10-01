import { query } from '../db';

export interface ReviewRow {
  id: string;
  product_id?: string | null;
  user_id?: string | null;
  order_id?: string | null;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
  is_verified_purchase?: boolean;
  is_approved?: boolean;
  created_at?: string;
  updated_at?: string;
  user_name?: string | null;
}

export class ReviewModel {
  static async findByProductId(productId: string): Promise<ReviewRow[]> {
    const res = await query<ReviewRow>(
      `SELECT r.*, COALESCE(u.full_name, 'Verified Collector') as user_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.product_id = $1 AND r.is_approved = true
       ORDER BY r.created_at DESC`,
      [productId]
    );
    return res.rows;
  }

  static async create(data: Omit<ReviewRow, 'id' | 'created_at' | 'updated_at' | 'user_name'>): Promise<ReviewRow> {
    const res = await query<ReviewRow>(
      `INSERT INTO reviews (product_id, user_id, order_id, rating, title, comment, is_verified_purchase, is_approved)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, false), COALESCE($8, true))
       RETURNING *`,
      [
        data.product_id || null,
        data.user_id || null,
        data.order_id || null,
        data.rating || 5,
        data.title || null,
        data.comment || null,
        data.is_verified_purchase ?? false,
        data.is_approved ?? true,
      ]
    );
    return res.rows[0];
  }

  static async getAverageRating(productId: string): Promise<{ avg: number; count: number }> {
    const res = await query<{ avg: string; count: string }>(
      'SELECT COALESCE(AVG(rating), 5.0) as avg, COUNT(*) as count FROM reviews WHERE product_id = $1 AND is_approved = true',
      [productId]
    );
    return {
      avg: parseFloat(res.rows[0]?.avg || '5.0'),
      count: parseInt(res.rows[0]?.count || '0', 10),
    };
  }
}
