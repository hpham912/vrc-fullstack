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

// Ensure bilingual columns exist on startup
pool.query(`
  ALTER TABLE events
    ADD COLUMN IF NOT EXISTS title_vi TEXT,
    ADD COLUMN IF NOT EXISTS title_en TEXT,
    ADD COLUMN IF NOT EXISTS description_vi TEXT,
    ADD COLUMN IF NOT EXISTS description_en TEXT,
    ADD COLUMN IF NOT EXISTS location_vi TEXT,
    ADD COLUMN IF NOT EXISTS location_en TEXT;
  ALTER TABLE daily_verses
    ADD COLUMN IF NOT EXISTS verse_text_vi TEXT,
    ADD COLUMN IF NOT EXISTS verse_text_en TEXT,
    ADD COLUMN IF NOT EXISTS reference_vi TEXT,
    ADD COLUMN IF NOT EXISTS reference_en TEXT,
    ADD COLUMN IF NOT EXISTS reflection_vi TEXT,
    ADD COLUMN IF NOT EXISTS reflection_en TEXT,
    ADD COLUMN IF NOT EXISTS prayer_vi TEXT,
    ADD COLUMN IF NOT EXISTS prayer_en TEXT;
`).catch((err) => console.warn('Bilingual column migration warning:', err.message));

export const db = drizzle(pool, { schema });
export { schema };
