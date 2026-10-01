import { query } from '../db';

export interface WishlistRow {
  id: string;
  user_id?: string | null;
  created_at?: string;
}

export class WishlistModel {
  static async findById(id: string): Promise<WishlistRow | null> {
    const res = await query<WishlistRow>('SELECT * FROM wishlists WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<WishlistRow | null> {
    const res = await query<WishlistRow>('SELECT * FROM wishlists WHERE user_id = $1 LIMIT 1', [userId]);
    return res.rows[0] || null;
  }

  static async getOrCreate(userId?: string | null): Promise<WishlistRow> {
    if (userId) {
      const existing = await this.findByUserId(userId);
      if (existing) return existing;
    }
    const res = await query<WishlistRow>(
      'INSERT INTO wishlists (user_id) VALUES ($1) RETURNING *',
      [userId || null]
    );
    return res.rows[0];
  }

  static async getWishlistWithProducts(wishlistId: string): Promise<any[]> {
    const res = await query(
      `SELECT 
        wi.id as item_id,
        wi.wishlist_id,
        wi.product_id,
        wi.created_at as saved_at,
        p.title,
        p.slug,
        p.base_price,
        p.brand,
        p.is_active,
        c.name as category_name,
        COALESCE(pi.image_url, '') as image_url,
        ROUND(COALESCE(AVG(r.rating), 5.0)::numeric, 1)::float as rating_avg
      FROM wishlist_items wi
      JOIN products p ON p.id = wi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN reviews r ON r.product_id = p.id AND r.is_approved = true
      LEFT JOIN LATERAL (
        SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1
      ) pi ON true
      WHERE wi.wishlist_id = $1
      GROUP BY wi.id, p.id, c.name, pi.image_url
      ORDER BY wi.created_at DESC`,
      [wishlistId]
    );
    return res.rows;
  }
}
