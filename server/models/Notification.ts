import { query } from '../db';

export class NotificationModel {
  static async create(data: {
    user_id?: string;
    title: string;
    message: string;
    type?: string;
  }) {
    const { user_id, title, message, type = 'system' } = data;
    const res = await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, message, type]
    );
    return res.rows[0];
  }

  static async findByUserId(user_id: string, limit = 50) {
    const res = await query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 OR user_id IS NULL
       ORDER BY created_at DESC 
       LIMIT $2`,
      [user_id, limit]
    );
    return res.rows;
  }

  static async markAsRead(id: string) {
    const res = await query(
      `UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *`,
      [id]
    );
    return res.rows[0];
  }
}
