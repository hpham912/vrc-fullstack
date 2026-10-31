import { ChurchEvent } from '../types.ts';

// Generates a Google Calendar link for a church event
export function getGoogleCalendarUrl(event: ChurchEvent): string {
  const title = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    `${event.description}\n\nLocation: ${event.location}${event.address ? `, ${event.address}` : ''}`
  );
  const location = encodeURIComponent(`${event.location}${event.address ? `, ${event.address}` : ''}`);

  // Format date and time
  const cleanDate = event.date.replace(/-/g, '');
  // Default to 10:00 AM if not parseable
  const startTimeStr = event.startTime.toLowerCase();
  let hour = 10;
  let minute = 0;

  const match = startTimeStr.match(/(\d+):?(\d*)\s*(am|pm)?/);
  if (match) {
    hour = parseInt(match[1], 10);
    minute = match[2] ? parseInt(match[2], 10) : 0;
    if (match[3] === 'pm' && hour < 12) hour += 12;
    if (match[3] === 'am' && hour === 12) hour = 0;
  }

  const pad = (n: number) => n.toString().padStart(2, '0');
  const startIso = `${cleanDate}T${pad(hour)}${pad(minute)}00`;
  const endIso = `${cleanDate}T${pad(Math.min(23, hour + 2))}${pad(minute)}00`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}

// Downloads an .ics iCalendar file for Apple Calendar, Outlook, etc.
export function downloadIcsFile(event: ChurchEvent) {
  const cleanDate = event.date.replace(/-/g, '');
  const pad = (n: number) => n.toString().padStart(2, '0');

  let hour = 10;
  let minute = 0;
  const match = event.startTime.toLowerCase().match(/(\d+):?(\d*)\s*(am|pm)?/);
  if (match) {
    hour = parseInt(match[1], 10);
    minute = match[2] ? parseInt(match[2], 10) : 0;
    if (match[3] === 'pm' && hour < 12) hour += 12;
    if (match[3] === 'am' && hour === 12) hour = 0;
  }

  const dtStart = `${cleanDate}T${pad(hour)}${pad(minute)}00`;
  const dtEnd = `${cleanDate}T${pad(Math.min(23, hour + 2))}${pad(minute)}00`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grace & Truth Church//Church Event//EN',
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
