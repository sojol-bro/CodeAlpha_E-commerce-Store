import { query } from '../db';
import { CartItemRow } from './CartItem';

export interface CartRow {
  id: string;
  user_id?: string | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
  items?: CartItemRow[];
}

export class CartModel {
  static async findById(id: string): Promise<CartRow | null> {
    const res = await query<CartRow>('SELECT * FROM carts WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findActiveByUserId(userId: string): Promise<CartRow | null> {
    const res = await query<CartRow>(
      "SELECT * FROM carts WHERE user_id = $1 AND status = 'active' ORDER BY updated_at DESC LIMIT 1",
      [userId]
    );
    return res.rows[0] || null;
  }

  static async getOrCreate(userId?: string | null): Promise<CartRow> {
    if (userId) {
      const existing = await this.findActiveByUserId(userId);
      if (existing) return existing;
    }
    const res = await query<CartRow>(
      "INSERT INTO carts (user_id, status) VALUES ($1, 'active') RETURNING *",
      [userId || null]
    );
    return res.rows[0];
  }

  static async getFullCart(cartId: string): Promise<{ cart: CartRow; items: any[]; subtotal: number }> {
    const cartRes = await query<CartRow>('SELECT * FROM carts WHERE id = $1', [cartId]);
    if (cartRes.rows.length === 0) {
      throw new Error('Cart not found');
    }

    const itemsRes = await query(
      `SELECT 
        ci.id,
        ci.cart_id,
        ci.product_variant_id,
        ci.quantity,
        ci.unit_price,
        pv.sku,
        pv.size,
        pv.color,
        pv.stock_quantity,
        p.id as product_id,
        p.title as product_title,
        p.slug as product_slug,
        p.brand as product_brand,
        COALESCE(pi.image_url, '') as product_image
      FROM cart_items ci
      JOIN product_variants pv ON pv.id = ci.product_variant_id
      JOIN products p ON p.id = pv.product_id
      LEFT JOIN LATERAL (
        SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY is_primary DESC, display_order ASC LIMIT 1
      ) pi ON true
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC`,
      [cartId]
    );

    const items = itemsRes.rows;
    const subtotal = items.reduce((acc, item) => acc + (parseFloat(item.unit_price) * item.quantity), 0);

    return {
      cart: cartRes.rows[0],
      items,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  static async clearCart(cartId: string): Promise<void> {
    await query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    await query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cartId]);
  }

  static async updateUserId(cartId: string, userId: string): Promise<void> {
    await query('UPDATE carts SET user_id = $1, updated_at = NOW() WHERE id = $2', [userId, cartId]);
  }
}
