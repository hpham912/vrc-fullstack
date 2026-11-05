import { sql } from 'drizzle-orm';
import { db } from './index.ts';

/**
 * Safely checks database connectivity on server startup.
 * Tables are managed by the database schema; if the DB user lacks DDL permissions
 * on schema public, we skip DDL statements without failing startup.
 */
export async function initializeDatabase() {
  try {
    await db.execute(sql`SELECT 1`);
  } catch (err: any) {
    console.warn('Database startup check warning:', err?.message || err);
  }
}
