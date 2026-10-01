import { query } from '../db';

export interface CouponRow {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number | string;
  minimum_order_amount?: number | string | null;
  maximum_discount?: number | string | null;
  usage_limit?: number | null;
  used_count?: number;
  start_date?: string | null;
  expiry_date?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export class CouponModel {
  static async findAll(): Promise<CouponRow[]> {
    const res = await query<CouponRow>('SELECT * FROM coupons ORDER BY created_at DESC');
    return res.rows;
  }

  static async findByCode(code: string): Promise<CouponRow | null> {
    const res = await query<CouponRow>('SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)', [code.trim()]);
    return res.rows[0] || null;
  }

  static async validateCoupon(code: string, cartTotal: number): Promise<{
    valid: boolean;
    coupon?: CouponRow;
    discountAmount: number;
    message?: string;
  }> {
    const coupon = await this.findByCode(code);
    if (!coupon) {
      return { valid: false, discountAmount: 0, message: 'Invalid promotional code.' };
    }

    if (!coupon.is_active) {
      return { valid: false, discountAmount: 0, message: 'This code is no longer active.' };
    }

    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { valid: false, discountAmount: 0, message: 'This code has expired.' };
    }

    if (coupon.usage_limit && (coupon.used_count ?? 0) >= coupon.usage_limit) {
      return { valid: false, discountAmount: 0, message: 'Usage limit reached for this code.' };
    }

    const minAmount = parseFloat((coupon.minimum_order_amount ?? 0).toString());
    if (minAmount > 0 && cartTotal < minAmount) {
      return {
        valid: false,
        discountAmount: 0,
        message: `Minimum order amount of $${minAmount} required.`,
      };
    }

    let discount = 0;
    const discVal = parseFloat(coupon.discount_value.toString());
    if (coupon.discount_type === 'percentage') {
      discount = (cartTotal * discVal) / 100;
      if (coupon.maximum_discount) {
        discount = Math.min(discount, parseFloat(coupon.maximum_discount.toString()));
      }
    } else {
      discount = Math.min(discVal, cartTotal);
    }

    return {
      valid: true,
      coupon,
      discountAmount: Math.round(discount * 100) / 100,
    };
  }

  static async incrementUsage(id: string): Promise<void> {
    await query('UPDATE coupons SET used_count = COALESCE(used_count, 0) + 1 WHERE id = $1', [id]);
  }

  static async toggleActive(id: string, isActive?: boolean): Promise<CouponRow | null> {
    const res = await query<CouponRow>(
      `UPDATE coupons 
       SET is_active = COALESCE($2, NOT is_active) 
       WHERE id = $1 
       RETURNING *`,
      [id, isActive ?? null]
    );
    return res.rows[0] || null;
  }

  static async create(data: Omit<CouponRow, 'id' | 'used_count' | 'created_at'>): Promise<CouponRow> {
    const res = await query<CouponRow>(
      `INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, maximum_discount, usage_limit, is_active)
       VALUES (UPPER($1), $2, $3, $4, $5, $6, $7, COALESCE($8, true))
       RETURNING *`,
      [
        data.code,
        data.description || null,
        data.discount_type,
        data.discount_value,
        data.minimum_order_amount ?? null,
        data.maximum_discount ?? null,
        data.usage_limit ?? null,
        data.is_active ?? true,
      ]
    );
    return res.rows[0];
  }
}
