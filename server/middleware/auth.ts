import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jfwjitqutdbueaxxxwld.supabase.co';
// The Service Role Key allows root-level database access and JWT verification
// MUST NEVER be exposed to frontend or committed to source control
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Server-side Supabase client for authenticating incoming API requests
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export interface AuthenticatedRequest extends Request {
  user?: any;
}

/**
 * Middleware: Extracts and validates Supabase JWT from incoming Authorization header
 * Header format: Authorization: Bearer <jwt_access_token>
 */
export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header. Expected Bearer token.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Token missing from Authorization header' });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired Supabase authentication token' });
    }

    // Attach authenticated user payload to request
    req.user = user;
    next();
  } catch (err: any) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ error: 'Internal error verifying authentication credentials' });
  }
}
