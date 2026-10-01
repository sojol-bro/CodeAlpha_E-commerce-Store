import { query } from '../db';

export interface ShipmentRow {
  id: string;
  order_id?: string | null;
  shipping_method_id?: string | null;
  tracking_number?: string | null;
  carrier?: string | null;
  status?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  created_at?: string;
  updated_at?: string;
  shipping_method_name?: string | null;
}

export class ShipmentModel {
  static async findByOrderId(orderId: string): Promise<ShipmentRow[]> {
    const res = await query<ShipmentRow>(
      `SELECT s.*, sm.name as shipping_method_name
       FROM shipments s
       LEFT JOIN shipping_methods sm ON sm.id = s.shipping_method_id
       WHERE s.order_id = $1
       ORDER BY s.created_at DESC`,
      [orderId]
    );
    return res.rows;
  }

  static async create(data: Omit<ShipmentRow, 'id' | 'created_at' | 'updated_at' | 'shipping_method_name'>): Promise<ShipmentRow> {
    const res = await query<ShipmentRow>(
      `INSERT INTO shipments (order_id, shipping_method_id, tracking_number, carrier, status, shipped_at, delivered_at)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'pending'), $6, $7)
       RETURNING *`,
      [
        data.order_id || null,
        data.shipping_method_id || null,
        data.tracking_number || `MIO-${Math.floor(100000 + Math.random() * 900000)}`,
        data.carrier || 'MIO White Glove Express',
        data.status || 'processing',
        data.shipped_at || null,
        data.delivered_at || null,
      ]
    );
    return res.rows[0];
  }

  static async updateStatus(id: string, status: string): Promise<ShipmentRow | null> {
    const isShipped = status === 'shipped';
    const isDelivered = status === 'delivered';
    const res = await query<ShipmentRow>(
      `UPDATE shipments
       SET status = $2,
           shipped_at = CASE WHEN $3 THEN NOW() ELSE shipped_at END,
           delivered_at = CASE WHEN $4 THEN NOW() ELSE delivered_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status, isShipped, isDelivered]
    );
    return res.rows[0] || null;
  }
}
