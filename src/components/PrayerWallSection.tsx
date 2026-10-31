import React, { useState } from 'react';
import { PrayerRequest } from '../types.ts';
import {
  Heart,
  PlusCircle,
  Sparkles,
  CheckCircle2,
  Lock,
  MessageSquare,
  X,
  Filter,
} from 'lucide-react';

interface PrayerWallSectionProps {
  prayers: PrayerRequest[];
  onPrayerAdded: () => void;
}

export const PrayerWallSection: React.FC<PrayerWallSectionProps> = ({
  prayers,
  onPrayerAdded,
}) => {
  const [filter, setFilter] = useState<'all' | 'prayer' | 'praise'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [prayedIds, setPrayedIds] = useState<number[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [request, setRequest] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPraise, setIsPraise] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePrayClick = async (id: number) => {
    if (prayedIds.includes(id)) return;

    try {
      setPrayedIds((prev) => [...prev, id]);
      await fetch(`/api/prayers/${id}/pray`, { method: 'POST' });
      onPrayerAdded();
    } catch (err) {
      console.error('Error incrementing prayer count:', err);
    }
  };

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !request.trim()) {
      setError('Please provide a title and your prayer details.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const res = await fetch('/api/prayers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          request: request.trim(),
          requesterName: isAnonymous ? 'Anonymous' : requesterName.trim() || 'Church Member',
          isAnonymous,
          isPraise,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit prayer');
      }

      // Reset form
      setTitle('');
      setRequest('');
      setRequesterName('');
      setIsAnonymous(false);
      setIsPraise(false);
      setModalOpen(false);
      onPrayerAdded();
    } catch (err: any) {
      setError(err.message || 'Error submitting request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPrayers = prayers.filter((p) => {
    if (filter === 'prayer') return !p.isPraise;
    if (filter === 'praise') return p.isPraise;
    return true;
  });

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Intercession & Gratitude
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mt-2">
            Community Prayer Wall
          </h2>
          <p className="text-stone-600 text-sm mt-1 max-w-xl">
            "Carry each other's burdens, and in this way you will fulfill the law of Christ." (Galatians 6:2). Join our church family in lifting up requests and celebrating answers.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-semibold shadow-md transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Submit a Prayer Request
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-stone-900 text-white'
              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
          }`}
        >
          All Entries ({prayers.length})
        </button>
        <button
          onClick={() => setFilter('prayer')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'prayer'
              ? 'bg-stone-900 text-white'
              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
          }`}
        >
          Prayer Petitions
        </button>
        <button
          onClick={() => setFilter('praise')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'praise'
              ? 'bg-amber-600 text-white'
              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
          }`}
        >
          Praise Reports ✨
        </button>
      </div>

      {/* Prayer Grid */}
      {filteredPrayers.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-stone-200">
          <Heart className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h3 className="font-serif text-lg font-bold text-stone-800">
            No prayer requests yet
          </h3>
          <p className="text-stone-500 text-xs mt-1">
            Be the first to share a prayer or praise report with our church community.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrayers.map((p) => {
            const hasPrayed = prayedIds.includes(p.id);
            const isAnswered = p.status === 'answered';

            return (
              <div
                key={p.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-all ${
                  p.isPraise
                    ? 'bg-amber-50/60 border-amber-200'
                    : isAnswered
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-white border-stone-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      {p.isPraise ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Praise Report
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-800">
                          Prayer Need
                        </span>
                      )}

                      {isAnswered && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Answered!
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-stone-400">
                      {new Date(p.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <h4 className="font-serif font-bold text-stone-900 text-base leading-snug">
                    {p.title}
                  </h4>

                  <p className="text-stone-700 text-xs sm:text-sm mt-2 leading-relaxed whitespace-pre-line">
                    "{p.request}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-200/60 flex items-center justify-between">
                  <div className="text-xs text-stone-500 flex items-center gap-1">
                    {p.isAnonymous ? (
                      <>
                        <Lock className="w-3 h-3 text-stone-400" />
                        <span>Anonymous Request</span>
                      </>
                    ) : (
                      <span>From: {p.requesterName}</span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePrayClick(p.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      hasPrayed
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-600 border border-stone-200'
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        hasPrayed ? 'fill-rose-600 text-rose-600' : 'text-stone-400'
                      }`}
                    />
                    <span>{p.prayerCount + (hasPrayed ? 1 : 0)} Prayed</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Prayer Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-stone-900 text-white">
              <div>
                <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                  Grace & Truth Prayer Wall
                </span>
                <h3 className="text-xl font-serif font-bold text-white">
                  Share Prayer or Praise
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPrayer} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setIsPraise(false)}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    !isPraise ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Prayer Request
                </button>
                <button
                  type="button"
                  onClick={() => setIsPraise(true)}
                  className={`py-2 text-xs font-bold rounded-md transition-all ${
                    isPraise ? 'bg-amber-600 text-white shadow-xs' : 'text-stone-600'
                  }`}
                >
                  Praise Report ✨
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Title or Topic *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Healing for my mother, Guidance in new job"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Prayer Request Details *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Share what is on your heart so our community can stand in agreement with you..."
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  disabled={isAnonymous}
                  placeholder="e.g. Sister Sarah"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-stone-100 disabled:opacity-60"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anonymousCheckbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="rounded border-stone-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="anonymousCheckbox" className="text-xs text-stone-700 cursor-pointer">
                  Post anonymously (hide my name from the public wall)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Posting...' : 'Submit to Prayer Wall'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
