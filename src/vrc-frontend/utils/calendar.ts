import { ChurchEvent } from '../types/index.ts';

// Parses an event time string like "03:00 PM" into 24-hour hour/minute.
// Default is 3:00 PM when the string is empty or unparsable.
function parseEventTimeString(timeStr: string): { hour: number; minute: number } {
  let hour = 15; // default 3:00 PM
  let minute = 0;
  const match = timeStr.toLowerCase().match(/(\d+):?(\d*)\s*(am|pm)?/);
  if (match) {
    hour = parseInt(match[1], 10);
    minute = match[2] ? parseInt(match[2], 10) : 0;
    if (match[3] === 'pm' && hour < 12) hour += 12;
    if (match[3] === 'am' && hour === 12) hour = 0;
  }
  return { hour, minute };
}

// Builds a local Date for an event's start (date + startTime).
// Returns null when the date is not a YYYY-MM-DD date.
export function getEventStartDate(event: ChurchEvent): Date | null {
  const dateParts = event.date.split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some((part) => isNaN(part))) return null;
  const [year, month, day] = dateParts;
  const { hour, minute } = parseEventTimeString(event.startTime || '');
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

// Builds a local Date for an event's end (date + endTime). When the event
// has no end time, the service is assumed to run 2 hours — the same
// default the calendar links use. If the parsed end is not after the
// start (bad input), it also falls back to start + 2 hours.
export function getEventEndDate(event: ChurchEvent): Date | null {
  const start = getEventStartDate(event);
  if (!start) return null;
  if (!event.endTime) {
    return new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }
  const dateParts = event.date.split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some((part) => isNaN(part))) return null;
  const [year, month, day] = dateParts;
  const { hour, minute } = parseEventTimeString(event.endTime);
  const end = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (end.getTime() <= start.getTime()) {
    return new Date(start.getTime() + 2 * 60 * 60 * 1000);
  }
  return end;
}

// Generates a Google Calendar link for a church event
export function getGoogleCalendarUrl(event: ChurchEvent): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    `${event.description}\n\nLocation: ${event.location}${event.address ? `, ${event.address}` : ''}`
  );
  const location = encodeURIComponent(`${event.location}${event.address ? `, ${event.address}` : ''}`);

  const cleanDate = event.date.replace(/-/g, '');
  const { hour, minute } = parseEventTimeString(event.startTime);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startIso = `${cleanDate}T${pad(hour)}${pad(minute)}00`;
  const endIso = `${cleanDate}T${pad(Math.min(23, hour + 2))}${pad(minute)}00`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

// Downloads an .ics iCalendar file for Apple Calendar, Outlook, etc.
export function downloadIcsFile(event: ChurchEvent) {
  const cleanDate = event.date.replace(/-/g, '');
  const pad = (n: number) => n.toString().padStart(2, '0');

  const { hour, minute } = parseEventTimeString(event.startTime);

  const dtStart = `${cleanDate}T${pad(hour)}${pad(minute)}00`;
  const dtEnd = `${cleanDate}T${pad(Math.min(23, hour + 2))}${pad(minute)}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vietnamese Revival Church//Church Event//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}${event.address ? `, ${event.address}` : ''}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
