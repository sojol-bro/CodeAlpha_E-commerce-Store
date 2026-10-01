import { query } from '../db';

export interface PaymentRow {
  id: string;
  order_id?: string | null;
  payment_method?: string | null;
  payment_provider?: string | null;
  transaction_id?: string | null;
  amount: number | string;
  currency?: string | null;
  status?: string | null;
  paid_at?: string | null;
  created_at?: string;
}

export class PaymentModel {
  static async findByOrderId(orderId: string): Promise<PaymentRow[]> {
    const res = await query<PaymentRow>('SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC', [orderId]);
    return res.rows;
  }

  static async create(data: Omit<PaymentRow, 'id' | 'created_at'>): Promise<PaymentRow> {
    const res = await query<PaymentRow>(
      `INSERT INTO payments (order_id, payment_method, payment_provider, transaction_id, amount, currency, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'USD'), COALESCE($7, 'completed'), COALESCE($8, NOW()))
       RETURNING *`,
      [
        data.order_id || null,
        data.payment_method || 'card',
        data.payment_provider || 'stripe_simulation',
        data.transaction_id || `txn_${Date.now()}`,
        data.amount,
        data.currency || 'USD',
        data.status || 'completed',
        data.paid_at || new Date().toISOString(),
      ]
    );
    return res.rows[0];
  }
}
