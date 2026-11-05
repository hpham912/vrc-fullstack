import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _vrcPostgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._vrcPostgresPool) {
    global._vrcPostgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
      idleTimeoutMillis: 30000,
    });

    global._vrcPostgresPool.on('error', (err) => {
      console.error('Database connection error in PostgreSQL pool:', err);
    });
  }
  return global._vrcPostgresPool;
};

const pool = createPool();

export const db = drizzle(pool, { schema });
export { schema };
