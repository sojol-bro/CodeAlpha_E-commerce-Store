import { query } from '../db';

export interface ReturnItemRow {
  id: string;
  return_id?: string | null;
  order_item_id?: string | null;
  quantity: number;
  reason?: string | null;
  condition?: string | null;
}

export class ReturnItemModel {
  static async findByReturnId(returnId: string): Promise<ReturnItemRow[]> {
    const res = await query<ReturnItemRow>('SELECT * FROM return_items WHERE return_id = $1', [returnId]);
    return res.rows;
  }

  static async create(data: Omit<ReturnItemRow, 'id'>): Promise<ReturnItemRow> {
    const res = await query<ReturnItemRow>(
      `INSERT INTO return_items (return_id, order_item_id, quantity, reason, condition)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.return_id || null,
        data.order_item_id || null,
        data.quantity,
        data.reason || null,
        data.condition || 'unopened',
      ]
    );
    return res.rows[0];
  }
}
