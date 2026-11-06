import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';
import * as schema from './schema.ts';

export type DatabaseEnvironment = 'development' | 'production';

// AsyncLocalStorage to automatically bind database operations to the requesting environment
export const dbContext = new AsyncLocalStorage<DatabaseEnvironment>();

declare global {
  var _vrcDevPostgresPool: Pool | undefined;
  var _vrcProdPostgresPool: Pool | undefined;
}

export const isSqlConfigured = (): boolean => {
  return Boolean(process.env.SQL_HOST && process.env.SQL_USER);
};

export const createPool = (databaseName: string, poolRef: 'dev' | 'prod'): Pool => {
  const globalKey = poolRef === 'dev' ? '_vrcDevPostgresPool' : '_vrcProdPostgresPool';

  if (!global[globalKey]) {
    const pool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: databaseName,
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      console.error(`Database connection error in PostgreSQL [${databaseName}] pool:`, err);
    });

    global[globalKey] = pool;
  }
  return global[globalKey]!;
};

// Distinct database connection pools for development and production
export const devPool = createPool('cloud_sql_development_database', 'dev');
export const prodPool = createPool('cloud_sql_production_database', 'prod');

export const devDb = drizzle(devPool, { schema });
export const prodDb = drizzle(prodPool, { schema });

/**
 * Determine the server process's default environment at startup:
 * If running on the production service (ais-pre) or SQL_DB_NAME is set to production,
 * the server defaults directly to production. Otherwise it defaults to development.
 */
export const STARTUP_ENV: DatabaseEnvironment =
  process.env.APP_URL?.includes('ais-pre') ||
  process.env.K_SERVICE?.includes('ais-pre') ||
  process.env.SQL_DB_NAME === 'cloud_sql_production_database'
    ? 'production'
    : 'development';

/**
 * Returns the Drizzle database instance for the active environment.
 * Evaluates request context (if set via middleware) or cleanly falls back to the server's STARTUP_ENV.
 */
export function getDb(env?: DatabaseEnvironment) {
  const targetEnv = env || dbContext.getStore() || STARTUP_ENV;
  return targetEnv === 'production' ? prodDb : devDb;
}

/**
 * Smart Drizzle database proxy that dynamically routes every query to either
 * cloud_sql_production_database or cloud_sql_development_database depending on the request context.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const activeDb = getDb();
    const val = (activeDb as any)[prop];
    return typeof val === 'function' ? val.bind(activeDb) : val;
  },
});

export { schema };
