import { query } from '../db';

export interface OrderItemRow {
  id: string;
  order_id?: string | null;
  product_id?: string | null;
  product_variant_id?: string | null;
  product_name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  size?: string | null;
  color?: string | null;
  created_at?: string;
}

export class OrderItemModel {
  static async findByOrderId(orderId: string): Promise<OrderItemRow[]> {
    const res = await query<OrderItemRow>(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC',
      [orderId]
    );
    return res.rows;
  }

  static async create(data: Omit<OrderItemRow, 'id' | 'created_at'>): Promise<OrderItemRow> {
    const res = await query<OrderItemRow>(
      `INSERT INTO order_items (order_id, product_id, product_variant_id, product_name, sku, quantity, unit_price, total_price, size, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.order_id || null,
        data.product_id || null,
        data.product_variant_id || null,
        data.product_name,
        data.sku || null,
        data.quantity,
        data.unit_price,
        data.total_price,
        data.size || null,
        data.color || null,
      ]
    );
    return res.rows[0];
  }
}
