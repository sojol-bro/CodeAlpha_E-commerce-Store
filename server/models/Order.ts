import { query } from '../db';
import { OrderItemRow } from './OrderItem';
import { PaymentRow } from './Payment';
import { ShipmentRow } from './Shipment';

export interface OrderRow {
  id: string;
  order_number: string;
  user_id?: string | null;
  shipping_address_id?: string | null;
  status?: string | null;
  subtotal: number | string;
  shipping_fee?: number | string | null;
  total_amount: number | string;
  payment_status?: string | null;
  ordered_at?: string;
  updated_at?: string;
  items?: OrderItemRow[];
  payment?: PaymentRow | null;
  shipment?: ShipmentRow | null;
  recipient_name?: string | null;
  city?: string | null;
  country?: string | null;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class OrderModel {
  static async findById(id: string): Promise<OrderRow | null> {
    if (!id || !UUID_REGEX.test(id.trim())) {
      return null;
    }
    const cleanId = id.trim();
    const res = await query<OrderRow>(
      `SELECT o.*, a.recipient_name, a.city, a.country, a.address_line1, a.phone
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.shipping_address_id
       WHERE o.id = $1`,
      [cleanId]
    );
    if (res.rows.length === 0) return null;
    const order = res.rows[0];

    const itemsRes = await query<OrderItemRow>('SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC', [cleanId]);
    const payRes = await query<PaymentRow>('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [cleanId]);
    const shipRes = await query<ShipmentRow>('SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [cleanId]);

    order.items = itemsRes.rows;
    order.payment = payRes.rows[0] || null;
    order.shipment = shipRes.rows[0] || null;
    return order;
  }

  static async findByOrderNumber(orderNumber: string): Promise<OrderRow | null> {
    if (!orderNumber || !orderNumber.trim()) return null;
    const cleanNo = orderNumber.trim();
    const res = await query<OrderRow>(
      `SELECT o.*, a.recipient_name, a.city, a.country, a.address_line1, a.phone
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.shipping_address_id
       WHERE UPPER(TRIM(o.order_number)) = UPPER(TRIM($1))`,
      [cleanNo]
    );
    if (res.rows.length === 0) return null;
    const order = res.rows[0];

    const itemsRes = await query<OrderItemRow>('SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC', [order.id]);
    const payRes = await query<PaymentRow>('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [order.id]);
    const shipRes = await query<ShipmentRow>('SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [order.id]);

    order.items = itemsRes.rows;
    order.payment = payRes.rows[0] || null;
    order.shipment = shipRes.rows[0] || null;
    return order;
  }

  /**
   * Resolves an order by order number, tracking number, or UUID safely
   */
  static async findByReference(reference: string): Promise<OrderRow | null> {
    if (!reference || !reference.trim()) return null;
    const cleanRef = reference.trim();

    // 1. Try order_number
    let res = await query<OrderRow>(
      `SELECT o.*, a.recipient_name, a.city, a.country, a.address_line1, a.phone
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.shipping_address_id
       WHERE UPPER(TRIM(o.order_number)) = UPPER(TRIM($1))`,
      [cleanRef]
    );

    // 2. Try tracking number via shipments
    if (res.rows.length === 0) {
      res = await query<OrderRow>(
        `SELECT o.*, a.recipient_name, a.city, a.country, a.address_line1, a.phone
         FROM orders o
         JOIN shipments s ON s.order_id = o.id
         LEFT JOIN addresses a ON a.id = o.shipping_address_id
         WHERE UPPER(TRIM(s.tracking_number)) = UPPER(TRIM($1))
         LIMIT 1`,
        [cleanRef]
      );
    }

    // 3. Try UUID if formatted as UUID
    if (res.rows.length === 0 && UUID_REGEX.test(cleanRef)) {
      res = await query<OrderRow>(
        `SELECT o.*, a.recipient_name, a.city, a.country, a.address_line1, a.phone
         FROM orders o
         LEFT JOIN addresses a ON a.id = o.shipping_address_id
         WHERE o.id = $1`,
        [cleanRef]
      );
    }

    if (res.rows.length === 0) return null;
    const order = res.rows[0];

    const itemsRes = await query<OrderItemRow>('SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at ASC', [order.id]);
    const payRes = await query<PaymentRow>('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [order.id]);
    const shipRes = await query<ShipmentRow>('SELECT * FROM shipments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1', [order.id]);

    order.items = itemsRes.rows;
    order.payment = payRes.rows[0] || null;
    order.shipment = shipRes.rows[0] || null;
    return order;
  }

  static async findByUserId(userId: string, limit = 20): Promise<OrderRow[]> {
    if (!userId || !userId.trim()) return [];
    const res = await query<OrderRow>(
      `SELECT o.*, a.recipient_name, a.city, a.country,
              COUNT(oi.id)::int as item_count
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.shipping_address_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1
       GROUP BY o.id, a.recipient_name, a.city, a.country
       ORDER BY o.ordered_at DESC
       LIMIT $2`,
      [userId.trim(), limit]
    );
    return res.rows;
  }

  static async findAll(limit = 50): Promise<OrderRow[]> {
    const res = await query<OrderRow>(
      `SELECT o.*, a.recipient_name, a.city, a.country,
              COUNT(oi.id)::int as item_count
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.shipping_address_id
       LEFT JOIN order_items oi ON oi.order_id = o.id
       GROUP BY o.id, a.recipient_name, a.city, a.country
       ORDER BY o.ordered_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  static async create(data: {
    order_number: string;
    user_id?: string | null;
    shipping_address_id?: string | null;
    status?: string;
    subtotal: number;
    shipping_fee?: number;
    total_amount: number;
    payment_status?: string;
  }): Promise<OrderRow> {
    const res = await query<OrderRow>(
      `INSERT INTO orders (order_number, user_id, shipping_address_id, status, subtotal, shipping_fee, total_amount, payment_status)
       VALUES ($1, $2, $3, COALESCE($4, 'pending'), $5, COALESCE($6, 0), $7, COALESCE($8, 'pending'))
       RETURNING *`,
      [
        data.order_number,
        data.user_id || null,
        data.shipping_address_id || null,
        data.status || 'pending',
        data.subtotal,
        data.shipping_fee || 0,
        data.total_amount,
        data.payment_status || 'pending',
      ]
    );
    return res.rows[0];
  }

  static async updateStatus(id: string, status: string, paymentStatus?: string): Promise<OrderRow | null> {
    const res = await query<OrderRow>(
      `UPDATE orders
       SET status = $2,
           payment_status = COALESCE($3, payment_status),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, paymentStatus || null]
    );
    return res.rows[0] || null;
  }
}
