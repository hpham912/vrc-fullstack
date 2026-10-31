import React, { useState } from 'react';
import { ChurchEvent } from '../types.ts';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  CalendarPlus,
  Download,
} from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '../utils/calendar.ts';

interface EventRsvpModalProps {
  event: ChurchEvent;
  onClose: () => void;
  onRsvpSuccess: () => void;
}

export const EventRsvpModal: React.FC<EventRsvpModalProps> = ({
  event,
  onClose,
  onRsvpSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [attendeesCount, setAttendeesCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/events/${event.id}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: name.trim(),
          userEmail: email.trim(),
          attendeesCount,
          notes: notes.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit RSVP');
      }

      setSuccess(true);
      onRsvpSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your RSVP.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-stone-900 text-stone-100 border-b border-stone-800">
          <div>
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Event Registration
            </span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-white truncate max-w-xs sm:max-w-md">
              {event.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                You're Registered!
              </h3>
              <p className="text-stone-600 text-sm max-w-sm mx-auto">
                Thank you, <span className="font-semibold text-stone-900">{name}</span>! We look forward to seeing you at{' '}
                <span className="font-semibold text-stone-900">{event.title}</span>. A confirmation has been recorded.
              </p>

              {/* Calendar export actions */}
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row gap-2 justify-center">
                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Add to Google Calendar
                </a>
                <button
                  onClick={() => downloadIcsFile(event)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download iCal / Outlook
                </button>
              </div>

              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Event brief */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1.5">
                <div className="flex items-center gap-2 text-stone-900 font-medium">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>
                    {new Date(event.date + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="text-stone-300">|</span>
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>{event.startTime} {event.endTime ? `- ${event.endTime}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <MapPin className="w-4 h-4 text-amber-700" />
                  <span>{event.location}{event.address ? ` (${event.address})` : ''}</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Number of Attendees (Family / Friends)
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setAttendeesCount(Math.max(1, attendeesCount - 1))}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 font-semibold text-stone-800 text-sm">
                      {attendeesCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttendeesCount(Math.min(10, attendeesCount + 1))}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-xs text-stone-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    Total guests attending
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Special Notes or Childcare Needs (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bringing 2 children for nursery, wheelchair access..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-stone-300 text-stone-700 hover:bg-stone-50 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Confirm RSVP'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
