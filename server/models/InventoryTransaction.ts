import { query } from '../db';

export interface InventoryTransactionRow {
  id: string;
  product_variant_id?: string | null;
  transaction_type: string;
  quantity: number;
  reference_id?: string | null;
  note?: string | null;
  created_at?: string;
  sku?: string | null;
  product_title?: string | null;
}

export class InventoryTransactionModel {
  static async findAll(limit = 50): Promise<InventoryTransactionRow[]> {
    const res = await query<InventoryTransactionRow>(
      `SELECT it.*, pv.sku, p.title as product_title
       FROM inventory_transactions it
       LEFT JOIN product_variants pv ON pv.id = it.product_variant_id
       LEFT JOIN products p ON p.id = pv.product_id
       ORDER BY it.created_at DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  }

  static async findByVariantId(variantId: string): Promise<InventoryTransactionRow[]> {
    const res = await query<InventoryTransactionRow>(
      'SELECT * FROM inventory_transactions WHERE product_variant_id = $1 ORDER BY created_at DESC',
      [variantId]
    );
    return res.rows;
  }

  static async create(data: {
    product_variant_id: string;
    transaction_type: 'purchase' | 'restock' | 'adjustment' | 'return' | string;
    quantity: number;
    reference_id?: string;
    note?: string;
  }): Promise<InventoryTransactionRow> {
    const res = await query<InventoryTransactionRow>(
      `INSERT INTO inventory_transactions (product_variant_id, transaction_type, quantity, reference_id, note)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.product_variant_id,
        data.transaction_type,
        data.quantity,
        data.reference_id || null,
        data.note || null,
      ]
    );
    return res.rows[0];
  }
}
