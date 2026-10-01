import { query } from '../db';

export interface WishlistItemRow {
  id: string;
  wishlist_id?: string | null;
  product_id?: string | null;
  created_at?: string;
}

export class WishlistItemModel {
  static async findByWishlistAndProduct(wishlistId: string, productId: string): Promise<WishlistItemRow | null> {
    const res = await query<WishlistItemRow>(
      'SELECT * FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2',
      [wishlistId, productId]
    );
    return res.rows[0] || null;
  }

  static async toggle(wishlistId: string, productId: string): Promise<{ action: 'added' | 'removed'; item?: WishlistItemRow }> {
    const existing = await this.findByWishlistAndProduct(wishlistId, productId);
    if (existing) {
      await query('DELETE FROM wishlist_items WHERE id = $1', [existing.id]);
      return { action: 'removed' };
    } else {
      const res = await query<WishlistItemRow>(
        'INSERT INTO wishlist_items (wishlist_id, product_id) VALUES ($1, $2) RETURNING *',
        [wishlistId, productId]
      );
      return { action: 'added', item: res.rows[0] };
    }
  }

  static async remove(wishlistId: string, productId: string): Promise<boolean> {
    const res = await query('DELETE FROM wishlist_items WHERE wishlist_id = $1 AND product_id = $2', [wishlistId, productId]);
    return (res.rowCount ?? 0) > 0;
  }
}
