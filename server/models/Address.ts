import { query } from '../db';

export interface AddressRow {
  id: string;
  user_id?: string | null;
  recipient_name?: string | null;
  phone?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  district?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export class AddressModel {
  static async findById(id: string): Promise<AddressRow | null> {
    const res = await query<AddressRow>('SELECT * FROM addresses WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<AddressRow[]> {
    const res = await query<AddressRow>('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [userId]);
    return res.rows;
  }

  static async create(data: Omit<AddressRow, 'id' | 'created_at' | 'updated_at'>): Promise<AddressRow> {
    if (data.is_default && data.user_id) {
      await query('UPDATE addresses SET is_default = false WHERE user_id = $1', [data.user_id]);
    }
    const res = await query<AddressRow>(
      `INSERT INTO addresses (user_id, recipient_name, phone, address_line1, address_line2, city, district, postal_code, country, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, false))
       RETURNING *`,
      [
        data.user_id || null,
        data.recipient_name || null,
        data.phone || null,
        data.address_line1 || null,
        data.address_line2 || null,
        data.city || null,
        data.district || null,
        data.postal_code || null,
        data.country || null,
        data.is_default || false,
      ]
    );
    return res.rows[0];
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM addresses WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
