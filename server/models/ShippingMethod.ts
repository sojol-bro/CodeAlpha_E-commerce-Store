import { query } from '../db';

export interface ShippingMethodRow {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  is_active?: boolean;
  created_at?: string;
}

export class ShippingMethodModel {
  static async findAll(activeOnly = true): Promise<ShippingMethodRow[]> {
    const filter = activeOnly ? 'WHERE is_active = true' : '';
    const res = await query<ShippingMethodRow>(`SELECT * FROM shipping_methods ${filter} ORDER BY price ASC`);
    return res.rows;
  }

  static async findById(id: string): Promise<ShippingMethodRow | null> {
    const res = await query<ShippingMethodRow>('SELECT * FROM shipping_methods WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async create(data: Omit<ShippingMethodRow, 'id' | 'created_at'>): Promise<ShippingMethodRow> {
    const res = await query<ShippingMethodRow>(
      `INSERT INTO shipping_methods (name, description, price, estimated_days_min, estimated_days_max, is_active)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, true))
       RETURNING *`,
      [
        data.name,
        data.description || null,
        data.price,
        data.estimated_days_min ?? null,
        data.estimated_days_max ?? null,
        data.is_active ?? true,
      ]
    );
    return res.rows[0];
  }
}
