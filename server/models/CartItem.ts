import { query } from '../db';

export interface CartItemRow {
  id: string;
  cart_id?: string | null;
  product_variant_id?: string | null;
  quantity?: number;
  unit_price: number | string;
  created_at?: string;
  updated_at?: string;
}

export class CartItemModel {
  static async findById(id: string): Promise<CartItemRow | null> {
    const res = await query<CartItemRow>('SELECT * FROM cart_items WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByCartAndVariant(cartId: string, variantId: string): Promise<CartItemRow | null> {
    const res = await query<CartItemRow>(
      'SELECT * FROM cart_items WHERE cart_id = $1 AND product_variant_id = $2',
      [cartId, variantId]
    );
    return res.rows[0] || null;
  }

  static async addItem(data: { cartId: string; variantId: string; quantity?: number; unitPrice: number }): Promise<CartItemRow> {
    const existing = await this.findByCartAndVariant(data.cartId, data.variantId);
    if (existing) {
      const newQty = (existing.quantity || 1) + (data.quantity || 1);
      const res = await query<CartItemRow>(
        `UPDATE cart_items
         SET quantity = $3,
             unit_price = $4,
             updated_at = NOW()
         WHERE id = $1 AND cart_id = $2
         RETURNING *`,
        [existing.id, data.cartId, newQty, data.unitPrice]
      );
      return res.rows[0];
    } else {
      const res = await query<CartItemRow>(
        `INSERT INTO cart_items (cart_id, product_variant_id, quantity, unit_price)
         VALUES ($1, $2, COALESCE($3, 1), $4)
         RETURNING *`,
        [data.cartId, data.variantId, data.quantity || 1, data.unitPrice]
      );
      return res.rows[0];
    }
  }

  static async updateQuantity(id: string, cartId: string, quantity: number): Promise<CartItemRow | null> {
    if (quantity <= 0) {
      await this.removeItem(id, cartId);
      return null;
    }
    const res = await query<CartItemRow>(
      `UPDATE cart_items
       SET quantity = $3,
           updated_at = NOW()
       WHERE id = $1 AND cart_id = $2
       RETURNING *`,
      [id, cartId, quantity]
    );
    return res.rows[0] || null;
  }

  static async removeItem(id: string, cartId: string): Promise<boolean> {
    const res = await query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [id, cartId]);
    return (res.rowCount ?? 0) > 0;
  }
}
