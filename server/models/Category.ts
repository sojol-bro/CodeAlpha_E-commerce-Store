import { query } from '../db';

export interface CategoryRow {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  product_count?: number;
}

export class CategoryModel {
  static async findAll(activeOnly = true): Promise<CategoryRow[]> {
    const filter = activeOnly ? 'WHERE c.is_active = true' : '';
    const res = await query<CategoryRow>(
      `SELECT c.*, COUNT(p.id)::int as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
       ${filter}
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    return res.rows;
  }

  static async findById(id: string): Promise<CategoryRow | null> {
    const res = await query<CategoryRow>('SELECT * FROM categories WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async create(data: { name: string; description?: string; image_url?: string; is_active?: boolean }): Promise<CategoryRow> {
    const res = await query<CategoryRow>(
      `INSERT INTO categories (name, description, image_url, is_active)
       VALUES ($1, $2, $3, COALESCE($4, true))
       RETURNING *`,
      [data.name, data.description || null, data.image_url || null, data.is_active ?? true]
    );
    return res.rows[0];
  }

  static async update(id: string, data: Partial<CategoryRow>): Promise<CategoryRow | null> {
    const res = await query<CategoryRow>(
      `UPDATE categories
       SET name = COALESCE($2, name),
           description = COALESCE($3, description),
           image_url = COALESCE($4, image_url),
           is_active = COALESCE($5, is_active),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.name || null, data.description || null, data.image_url || null, data.is_active ?? null]
    );
    return res.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM categories WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }
}
