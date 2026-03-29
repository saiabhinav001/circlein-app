export type ICSEventInput = {
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  organizerEmail: string;
  attendeeEmail: string;
};

function escapeICS(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

export function generateICS(event: ICSEventInput): string {
  const now = new Date();
  const uid = `${formatICSDate(event.startDate)}-${event.attendeeEmail}@circlein`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CircleIn//Community Bookings//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${escapeICS(uid)}`,
    `DTSTART:${formatICSDate(event.startDate)}`,
    `DTEND:${formatICSDate(event.endDate)}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `ORGANIZER;CN=CircleIn:mailto:${escapeICS(event.organizerEmail)}`,
    `ATTENDEE;CN=Resident;ROLE=REQ-PARTICIPANT:mailto:${escapeICS(event.attendeeEmail)}`,
    `SUMMARY:${escapeICS(event.title)}`,
    `DESCRIPTION:${escapeICS(event.description)}`,
    `LOCATION:${escapeICS(event.location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return `${lines.join('\r\n')}\r\n`;
}
