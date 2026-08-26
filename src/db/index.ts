import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, PoolConfig } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

// Global pool caching across hot-reloads and container lifecycles
declare global {
  var _postgresPool: Pool | undefined;
}

export function getPoolConfig(): PoolConfig {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.SUPABASE_DB_URL;

  if (databaseUrl) {
    return {
      connectionString: databaseUrl,
      ssl: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')
        ? false
        : { rejectUnauthorized: false },
      max: 10,
      connectionTimeoutMillis: 15000,
    };
  }

  // Cloud SQL or individual environment variables
  return {
    host: process.env.SQL_HOST || '127.0.0.1',
    port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
    user: process.env.SQL_USER || process.env.SQL_ADMIN_USER || 'app_user',
    password: process.env.SQL_PASSWORD || process.env.SQL_ADMIN_PASSWORD || '',
    database: process.env.SQL_DB_NAME || 'designers_domain_db',
    max: 10,
    connectionTimeoutMillis: 15000,
  };
}

export const createPool = (): Pool => {
  if (!global._postgresPool) {
    const config = getPoolConfig();
    global._postgresPool = new Pool(config);

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();
export const db = drizzle(pool, { schema });
export { schema };
