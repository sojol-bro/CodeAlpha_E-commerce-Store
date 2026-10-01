import { query } from '../db';

export interface UserRow {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class UserModel {
  static async findById(id: string): Promise<UserRow | null> {
    const res = await query<UserRow>('SELECT id, email, full_name, phone, role, created_at, updated_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByEmail(email: string): Promise<UserRow | null> {
    const res = await query<UserRow>('SELECT id, email, full_name, phone, role, created_at, updated_at FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  static async findAll(limit = 20): Promise<UserRow[]> {
    const res = await query<UserRow>('SELECT id, email, full_name, phone, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  }

  static async create(data: { id?: string; email: string; full_name?: string; phone?: string; role?: string }): Promise<UserRow> {
    const res = await query<UserRow>(
      `INSERT INTO users (id, email, full_name, phone, role)
       VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, COALESCE($5, 'customer'))
       RETURNING id, email, full_name, phone, role, created_at, updated_at`,
      [data.id || null, data.email, data.full_name || null, data.phone || null, data.role || 'customer']
    );
    return res.rows[0];
  }

  static async update(id: string, data: Partial<{ full_name: string; phone: string; role: string }>): Promise<UserRow | null> {
    const res = await query<UserRow>(
      `UPDATE users
       SET full_name = COALESCE($2, full_name),
           phone = COALESCE($3, phone),
           role = COALESCE($4, role),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, phone, role, created_at, updated_at`,
      [id, data.full_name || null, data.phone || null, data.role || null]
    );
    return res.rows[0] || null;
  }
}
