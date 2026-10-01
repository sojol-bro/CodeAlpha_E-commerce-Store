import { query } from '../db';

export interface AuditLogRow {
  id: string;
  admin_user_id?: string | null;
  action: string;
  entity_type?: string | null;
  entity_id?: string | null;
  old_data?: any;
  new_data?: any;
  created_at?: string;
}

export class AuditLogModel {
  static async findAll(limit = 50): Promise<AuditLogRow[]> {
    const res = await query<AuditLogRow>(
      'SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return res.rows;
  }

  static async log(data: {
    admin_user_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    old_data?: any;
    new_data?: any;
  }): Promise<AuditLogRow> {
    const res = await query<AuditLogRow>(
      `INSERT INTO admin_audit_logs (admin_user_id, action, entity_type, entity_id, old_data, new_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.admin_user_id || null,
        data.action,
        data.entity_type || null,
        data.entity_id || null,
        data.old_data ? JSON.stringify(data.old_data) : null,
        data.new_data ? JSON.stringify(data.new_data) : null,
      ]
    );
    return res.rows[0];
  }
}
