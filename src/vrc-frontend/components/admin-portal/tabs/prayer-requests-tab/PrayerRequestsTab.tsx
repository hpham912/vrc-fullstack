import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../../utils/api.ts';
import { prayerRequestsTabStyles as s } from './PrayerRequestsTab.styles.ts';

interface PrayerRequest {
  id: number;
  title: string;
  request: string;
  requesterName: string;
  createdAt?: string;
}

interface PrayerRequestsTabProps {
  getToken: () => string | null;
  showFeedback: (type: 'success' | 'error', message: string) => void;
  // Which tab the parent is showing. The child stays mounted for the
  // whole portal session (returning null when its tab isn't active) and
  // reloads whenever its tab is opened, exactly as before the split.
  activeTab: string;
}

// Prayer requests list. Owns its own list state and loading — the parent
// only renders this tab when it is active, so loading on mount is the
// same as loading when the tab is opened.
export const PrayerRequestsTab: React.FC<PrayerRequestsTabProps> = ({ getToken, showFeedback, activeTab }) => {
  const { t } = useLanguage();
  const [prayerList, setPrayerList] = useState<PrayerRequest[]>([]);
  const [expandedPrayerIds, setExpandedPrayerIds] = useState<Set<number>>(new Set());

  const loadPrayerRequests = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(apiUrl('/api/prayers'), {
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        const data = await res.json();
        setPrayerList(data);
      }
    } catch (err) {
      console.error('Failed to load prayer requests:', err);
    }
  };

  const handleDeletePrayer = async (id: number) => {
    try {
      const token = getToken();
      const res = await fetch(apiUrl(`/api/prayers/${id}`), {
        method: 'DELETE',
        headers: apiHeaders({ Authorization: `Bearer ${token}` }),
      });
      if (res.ok) {
        setPrayerList((prev) => prev.filter((p) => p.id !== id));
        showFeedback('success', t('adminPrayerDeleted'));
      }
    } catch (err: any) {
      showFeedback('error', err.message || 'Error deleting prayer request');
    }
  };

  useEffect(() => {
    if (activeTab === 'prayer-requests') {
      loadPrayerRequests();
    }
  }, [activeTab]);

  if (activeTab !== 'prayer-requests') return null;

  return (
    <div className={s.container}>
      <div className={s.headerRow}>
        <h3 className={s.title}>
          {t('adminPrayerTitle')} ({prayerList.length})
        </h3>
        <button
          type="button"
          onClick={loadPrayerRequests}
          className={s.refreshBtn}
        >
          <RefreshCw className={s.refreshIcon} />
          <span>{t('commonRefresh')}</span>
        </button>
      </div>

      {prayerList.length === 0 ? (
        <div className={s.emptyState}>
          {t('adminPrayerEmpty')}
        </div>
      ) : (
        <div className={s.list}>
          {prayerList.map((p) => {
            const isExpanded = expandedPrayerIds.has(p.id);
            const firstSentenceMatch = p.request.match(/^.*?[.!?](?:\s|$)/);
            const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : p.request.slice(0, 100);
            const isLong = p.request.length > firstSentence.length + 3;

            return (
              <div key={p.id} className={s.item}>
                <div className={s.itemBody}>
                  <div className={s.itemMeta}>
                    <span className={s.requesterName}>
                      {p.requesterName || t('commonAnonymous')}
                    </span>
                    {p.createdAt && (
                      <span className={s.createdAt}>
                        • {new Date(p.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className={s.requestText}>
                    {isExpanded || !isLong ? p.request : `${firstSentence}...`}
                  </p>
                  {isLong && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPrayerIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.id)) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        })
                      }
                      className={s.toggleBtn}
                    >
                      {isExpanded
                        ? t('commonShowLess')
                        : t('commonReadMore')}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDeletePrayer(p.id)}
                  className={s.deleteBtn}
                  title={t('commonDelete')}
                >
                  <Trash2 className={s.deleteIcon} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
