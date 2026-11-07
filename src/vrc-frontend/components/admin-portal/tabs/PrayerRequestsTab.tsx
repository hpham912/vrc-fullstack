import React, { useEffect, useState } from 'react';
import { RefreshCw, Trash2 } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext.tsx';
import { apiUrl, apiHeaders } from '../../../utils/api.ts';

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
    <div className="space-y-4 max-w-2xl mx-auto w-full min-w-0">
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-bold text-stone-900 text-base">
          {t('adminPrayerTitle')} ({prayerList.length})
        </h3>
        <button
          type="button"
          onClick={loadPrayerRequests}
          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t('commonRefresh')}</span>
        </button>
      </div>

      {prayerList.length === 0 ? (
        <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
          {t('adminPrayerEmpty')}
        </div>
      ) : (
        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
          {prayerList.map((p) => {
            const isExpanded = expandedPrayerIds.has(p.id);
            const firstSentenceMatch = p.request.match(/^.*?[.!?](?:\s|$)/);
            const firstSentence = firstSentenceMatch ? firstSentenceMatch[0].trim() : p.request.slice(0, 100);
            const isLong = p.request.length > firstSentence.length + 3;

            return (
              <div key={p.id} className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-stone-900 text-sm">
                      {p.requesterName || t('commonAnonymous')}
                    </span>
                    {p.createdAt && (
                      <span className="text-xs text-stone-500">
                        • {new Date(p.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-stone-700 whitespace-pre-line leading-relaxed">
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
                      className="text-xs font-bold text-amber-800 hover:text-amber-950 underline"
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
                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors flex-shrink-0"
                  title={t('commonDelete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
