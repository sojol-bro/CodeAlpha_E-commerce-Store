import { query } from '../db';
import { ReturnItemRow } from './ReturnItem';

export interface ReturnRow {
  id: string;
  order_id?: string | null;
  user_id?: string | null;
  reason: string;
  status?: string | null;
  refund_amount?: number | string | null;
  customer_note?: string | null;
  admin_note?: string | null;
  requested_at?: string;
  approved_at?: string | null;
  completed_at?: string | null;
  items?: ReturnItemRow[];
  order_number?: string | null;
}

export class ReturnModel {
  static async findById(id: string): Promise<ReturnRow | null> {
    const res = await query<ReturnRow>(
      `SELECT r.*, o.order_number
       FROM returns r
       LEFT JOIN orders o ON o.id = r.order_id
       WHERE r.id = $1`,
      [id]
    );
    if (res.rows.length === 0) return null;
    const item = res.rows[0];
    const itemsRes = await query<ReturnItemRow>('SELECT * FROM return_items WHERE return_id = $1', [id]);
    item.items = itemsRes.rows;
    return item;
  }

  static async findByOrderId(orderId: string): Promise<ReturnRow[]> {
    const res = await query<ReturnRow>('SELECT * FROM returns WHERE order_id = $1 ORDER BY requested_at DESC', [orderId]);
    return res.rows;
  }

  static async findAll(limit = 50): Promise<ReturnRow[]> {
    const res = await query<ReturnRow>(
      `SELECT r.*, o.order_number
       FROM returns r
       LEFT JOIN orders o ON o.id = r.order_id
       ORDER BY r.requested_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  static async create(data: {
    order_id?: string;
    user_id?: string;
    reason: string;
    refund_amount?: number;
    customer_note?: string;
    status?: string;
  }): Promise<ReturnRow> {
    const res = await query<ReturnRow>(
      `INSERT INTO returns (order_id, user_id, reason, status, refund_amount, customer_note)
       VALUES ($1, $2, $3, COALESCE($4, 'requested'), $5, $6)
       RETURNING *`,
      [
        data.order_id || null,
        data.user_id || null,
        data.reason,
        data.status || 'requested',
        data.refund_amount ?? null,
        data.customer_note || null,
      ]
    );
    return res.rows[0];
  }

  static async updateStatus(id: string, status: string, adminNote?: string): Promise<ReturnRow | null> {
    const isApproved = status === 'approved';
    const isCompleted = status === 'completed';
    const res = await query<ReturnRow>(
      `UPDATE returns
       SET status = $2,
           admin_note = COALESCE($3, admin_note),
           approved_at = CASE WHEN $4 THEN NOW() ELSE approved_at END,
           completed_at = CASE WHEN $5 THEN NOW() ELSE completed_at END
       WHERE id = $1
       RETURNING *`,
      [id, status, adminNote || null, isApproved, isCompleted]
    );
    return res.rows[0] || null;
  }
}
