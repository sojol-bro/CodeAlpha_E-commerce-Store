import dns from 'dns';

// Ensure Node.js prioritizes verbatim IPv6/IPv4 order for Supabase direct connections
dns.setDefaultResultOrder('verbatim');

import { QueryResult, QueryResultRow } from 'pg';
import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import dotenv from 'dotenv';

dotenv.config();

let pgliteInstance: PGlite | null = null;
let pgPoolInstance: Pool | null = null;
let activeEngine: string = 'Initializing';
let initPromise: Promise<void> | null = null;

// Normalize connection string to handle unescaped password characters like '&' and '@'
function normalizeConnectionString(rawUrl?: string): string {
  const defaultUrl = 'postgresql://postgres:mitosis%26%403997@db.jfwjitqutdbueaxxxwld.supabase.co:5432/postgres';
  let url = (rawUrl || defaultUrl).trim();

  // If password contains raw '&' or '@' before the host '@', properly percent-encode it
  if (url.includes('mitosis&@3997')) {
    url = url.replace('mitosis&@3997', 'mitosis%26%403997');
  }

  return url;
}

// Custom DNS lookup that supports IPv6 AAAA lookups on platforms where A records are absent
function customLookup(
  hostname: string,
  options: any,
  callback: (err: NodeJS.ErrnoException | null, address: string, family: number) => void
) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  dns.lookup(hostname, { ...options, verbatim: true }, (err, address, family) => {
    if (!err && address) {
      return callback(null, address, family);
    }

    // Explicit fallback: resolve IPv6 (AAAA) record
    dns.resolve6(hostname, (rErr, addresses) => {
      if (!rErr && addresses && addresses.length > 0) {
        return callback(null, addresses[0], 6);
      }
      callback(err || rErr || new Error(`Could not resolve host ${hostname}`), '', 4);
    });
  });
}

async function initializeDatabase() {
  const connectionString = normalizeConnectionString(process.env.DATABASE_URL);

  try {
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 15,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000,
      lookup: customLookup,
    } as any);

    // Test connection with a lightweight probe query
    await pool.query('SELECT 1');
    pgPoolInstance = pool;
    activeEngine = 'Supabase PostgreSQL (db.jfwjitqutdbueaxxxwld.supabase.co)';
    console.log(`Successfully connected to ${activeEngine}`);
    return;
  } catch (err: any) {
    console.warn(`Primary Supabase connection encountered notice: ${err.message}. Initializing embedded PostgreSQL fallback.`);
  }

  // Graceful fallback to embedded PostgreSQL engine if network connectivity is interrupted
  pgliteInstance = new PGlite();
  activeEngine = 'Embedded PostgreSQL (PGlite Fallback)';
  console.log('Active Database:', activeEngine);
}

export async function ensureDbReady() {
  if (!initPromise) {
    initPromise = initializeDatabase();
  }
  await initPromise;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  await ensureDbReady();
  const start = Date.now();

  try {
    if (pgPoolInstance) {
      const res = await pgPoolInstance.query<T>(text, params);
      return res;
    } else if (pgliteInstance) {
      const res = await pgliteInstance.query<T>(text, params);
      return {
        rows: (res.rows as T[]) || [],
        rowCount: res.affectedRows ?? res.rows.length,
        command: '',
        oid: 0,
        fields: (res.fields as any) || [],
      };
    }
    throw new Error('Database client not initialized');
  } catch (err: any) {
    console.error('Database query error:', {
      text,
      error: err.message,
      duration: Date.now() - start,
    });
    throw err;
  }
}

export async function testConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  engine: string;
  error?: string;
}> {
  const start = Date.now();
  try {
    await query('SELECT NOW() as current_time');
    return {
      connected: true,
      latencyMs: Date.now() - start,
      engine: activeEngine,
    };
  } catch (err: any) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      engine: activeEngine,
      error: err.message,
    };
  }
}

// Compatibility proxy
export const pool = {
  query: <T extends QueryResultRow = any>(text: string, params?: any[]) => query<T>(text, params),
};
