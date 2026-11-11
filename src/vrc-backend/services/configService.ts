import { eq } from 'drizzle-orm';
import { db } from '../../vrc-db/index.ts';
import { churchInfo, spotlight } from '../../vrc-db/schema.ts';
import type { ChurchInfoData } from '../routes/churchInfoRoutes.ts';
import type { SpotlightData } from '../routes/spotlightRoutes.ts';

// Church info + spotlight now live in Postgres (moved from Firestore
// 2026-11-10). Each database holds a single row per table (id is always
// 1) — the dev and prod databases are separate, so there is no dev/prod
// split inside the tables. The whole document is stored as JSONB, the
// way the routes already treat it (read/write as one document).
const CHURCH_INFO_ID = 1;
const SPOTLIGHT_ID = 1;

export const ConfigService = {
  async getChurchInfo(): Promise<ChurchInfoData | null> {
    try {
      const rows = await db
        .select()
        .from(churchInfo)
        .where(eq(churchInfo.id, CHURCH_INFO_ID))
        .limit(1);
      if (rows.length > 0 && rows[0].data) {
        return rows[0].data as ChurchInfoData;
      }
      return null;
    } catch (err) {
      console.warn('Error reading church_info from Postgres:', err);
      return null;
    }
  },

  async saveChurchInfo(data: ChurchInfoData): Promise<void> {
    await db
      .insert(churchInfo)
      .values({ id: CHURCH_INFO_ID, data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: churchInfo.id,
        set: { data, updatedAt: new Date() },
      });
  },

  async getSpotlight(): Promise<SpotlightData | null> {
    try {
      const rows = await db
        .select()
        .from(spotlight)
        .where(eq(spotlight.id, SPOTLIGHT_ID))
        .limit(1);
      if (rows.length > 0 && rows[0].data) {
        return rows[0].data as SpotlightData;
      }
      return null;
    } catch (err) {
      console.warn('Error reading spotlight from Postgres:', err);
      return null;
    }
  },

  async saveSpotlight(data: SpotlightData): Promise<void> {
    await db
      .insert(spotlight)
      .values({ id: SPOTLIGHT_ID, data, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: spotlight.id,
        set: { data, updatedAt: new Date() },
      });
  },
};
