export interface Category {
  id: string;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  product_count?: number;
}

export interface ProductVariant {
  id: string;
  product_id?: string | null;
  sku?: string | null;
  size?: string | null;
  color?: string | null;
  price: number | string;
  stock_quantity: number;
  is_active?: boolean;
}

export interface ProductImage {
  id: string;
  product_id?: string | null;
  image_url: string;
  alt_text?: string | null;
  display_order?: number;
  is_primary?: boolean;
}

export interface Product {
  id: string;
  category_id?: string | null;
  category_name?: string | null;
  title: string;
  slug: string;
  description?: string | null;
  brand?: string | null;
  base_price: number | string;
  is_active?: boolean;
  variants?: ProductVariant[];
  images?: ProductImage[];
  rating_avg?: number;
  rating_count?: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_variant_id: string;
  quantity: number;
  unit_price: number | string;
  sku?: string;
  size?: string;
  color?: string;
  stock_quantity?: number;
  product_id: string;
  product_title: string;
  product_slug: string;
  product_brand?: string;
  product_image?: string;
}

export interface Cart {
  id: string;
  user_id?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  estimated_days_min?: number | null;
  estimated_days_max?: number | null;
  is_active?: boolean;
}

export interface Review {
  id: string;
  product_id?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  is_verified_purchase?: boolean;
  created_at?: string;
  user_name?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  sku?: string;
  quantity: number;
  unit_price: number | string;
  total_price: number | string;
  size?: string;
  color?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  shipping_address_id?: string | null;
  status: string;
  subtotal: number | string;
  shipping_fee: number | string;
  total_amount: number | string;
  payment_status: string;
  ordered_at: string;
  items?: OrderItem[];
  recipient_name?: string;
  city?: string;
  country?: string;
  shipment?: {
    id: string;
    tracking_number?: string;
    carrier?: string;
    status: string;
    shipped_at?: string;
    delivered_at?: string;
  } | null;
}

export interface DatabaseStats {
  connected: boolean;
  latencyMs: number;
  databaseEngine: string;
  requiredTablesCount: number;
  tablesReport: Record<string, number>;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserAddress {
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

