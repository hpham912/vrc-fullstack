import { useCallback, useEffect, useRef } from 'react';
import { apiUrl, apiHeaders } from '../../utils/api.ts';

// The collections GET /api/sync reports on — one entry per thing the
// app shows. Keep in sync with syncRoutes.ts on the backend.
export type SyncCollection = 'events' | 'verses' | 'videos' | 'notifications' | 'churchInfo' | 'spotlight';

export interface SyncEntry {
  count: number;
  updatedAt: string | null;
}

export type SyncSnapshot = Record<SyncCollection, SyncEntry>;

export const SYNC_COLLECTIONS: SyncCollection[] = [
  'events',
  'verses',
  'videos',
  'notifications',
  'churchInfo',
  'spotlight',
];

// Checks GET /api/sync and calls onChanged with the collections whose
// row count or latest change time moved since the last check. The
// first check only sets the baseline (nothing is "changed" yet).
// There is NO timer here on purpose — the app does not poll on an
// interval. It checks when the app comes back to the foreground, and
// the caller can call checkNow() whenever it wants fresh data (tab
// switch, pull-to-refresh). A failed check is best-effort (it just
// retries next time); the sync never shows an error to the user.
export const useDataSync = (onChanged: (changed: SyncCollection[]) => void) => {
  const lastSeenRef = useRef<SyncSnapshot | null>(null);
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const check = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/sync'), { cache: 'no-store', headers: apiHeaders() });
      if (!res.ok) return;
      const snap = (await res.json()) as SyncSnapshot;
      const prev = lastSeenRef.current;
      lastSeenRef.current = snap;
      if (!prev) return;
      const changed = SYNC_COLLECTIONS.filter((key) => {
        const next = snap[key];
        const prevEntry = prev[key];
        if (!next || !prevEntry) return false;
        return next.count !== prevEntry.count || next.updatedAt !== prevEntry.updatedAt;
      });
      if (changed.length > 0) onChangedRef.current(changed);
    } catch {
      // Best-effort: a failed check just retries on the next trigger.
    }
  }, []);

  useEffect(() => {
    check();
    const onForeground = () => {
      if (!document.hidden) check();
    };
    document.addEventListener('visibilitychange', onForeground);
    window.addEventListener('focus', onForeground);
    return () => {
      document.removeEventListener('visibilitychange', onForeground);
      window.removeEventListener('focus', onForeground);
    };
  }, [check]);

  return { checkNow: check };
};
