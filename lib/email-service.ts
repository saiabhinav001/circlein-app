import nodemailer from 'nodemailer';
import { formatDateInTimeZone } from '@/lib/timezone';

interface EmailTemplateResult {
  subject: string;
  html: string;
}

interface LayoutOptions {
  preheader: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  introHtml: string;
  detailsRows?: Array<{ label: string; value: string }>;
  statusHtml?: string;
  contentHtml?: string;
  cta?: {
    label: string;
    url: string;
  };
  accent: {
    from: string;
    to: string;
    text: string;
  };
}

const APP_URL = process.env.NEXTAUTH_URL || 'https://circlein-app.vercel.app';

const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'circleinapp1@gmail.com';
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailPassword) {
    console.error('EMAIL_PASSWORD not configured. Email delivery is disabled.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

const transporter = createTransporter();

transporter.verify((error) => {
  if (error) {
    console.error('Email transporter verification failed:', error.message);
  } else {
    console.log('Email service is ready.');
  }
});

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeDateLabel = (value: string): string => {
  if (!value) {
    return 'N/A';
  }

  // If date is already human-readable (e.g. "Friday, March 22, 2026"), keep it as-is.
  if (/[a-zA-Z]/.test(value) && !/\d{4}-\d{2}-\d{2}T/.test(value)) {
    return escapeHtml(value);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return escapeHtml(value);
  }

  return formatDateInTimeZone(parsed, 'UTC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const safeUrl = (value?: string): string => {
  if (!value) {
    return APP_URL;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${APP_URL}${value}`;
  }

  return `${APP_URL}/${value}`;
};

const renderDetailRows = (rows: Array<{ label: string; value: string }>) => {
  if (!rows.length) {
    return '';
  }

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-top: 18px;">
      ${rows
        .map(
          (row) => `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #334155; font-weight: 600; font-size: 13px; width: 36%; vertical-align: top;">${escapeHtml(row.label)}</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-size: 14px; font-weight: 600; text-align: right; vertical-align: top;">${escapeHtml(row.value)}</td>
            </tr>
          `
        )
        .join('')}
    </table>
  `;
};

const renderLayout = (options: LayoutOptions): string => {
  const details = options.detailsRows?.length
    ? `
      <section style="margin-top: 26px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 18px 12px;">
        ${renderDetailRows(options.detailsRows)}
      </section>
    `
    : '';

  const cta = options.cta
    ? `
      <div style="margin-top: 26px; text-align: center;">
        <a href="${safeUrl(options.cta.url)}" style="display: inline-block; padding: 13px 26px; border-radius: 10px; text-decoration: none; color: #ffffff; font-weight: 700; font-size: 14px; background: linear-gradient(135deg, ${options.accent.from}, ${options.accent.to});">${escapeHtml(options.cta.label)}</a>
      </div>
    `
    : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(options.title)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #e2e8f0; font-family: 'Segoe UI', Arial, sans-serif;">
        <span style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all;">${escapeHtml(options.preheader)}</span>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: radial-gradient(circle at top right, #f8fafc 0%, #e2e8f0 100%); padding: 30px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width: 100%; max-width: 640px; border-collapse: collapse; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #dbe3ee; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);">
                <tr>
                  <td style="padding: 28px 28px 24px; background: linear-gradient(135deg, ${options.accent.from}, ${options.accent.to}); color: #ffffff;">
                    <div style="font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 700; opacity: 0.88;">${escapeHtml(options.eyebrow)}</div>
                    <h1 style="margin: 8px 0 8px; font-size: 31px; line-height: 1.2; font-weight: 800;">${escapeHtml(options.title)}</h1>
                    <p style="margin: 0; font-size: 14px; line-height: 1.6; opacity: 0.94;">${escapeHtml(options.subtitle)}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px; color: #0f172a;">
                    <div style="font-size: 15px; line-height: 1.8; color: #334155;">${options.introHtml}</div>
                    ${options.statusHtml || ''}
                    ${details}
                    ${options.contentHtml || ''}
                    ${cta}
                    <div style="margin-top: 28px; padding-top: 16px; border-top: 1px dashed #dbe3ee; color: #64748b; font-size: 12px; line-height: 1.7;">
                      CircleIn updates are automated so your community never misses key events. If you need help, contact your community admin.
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; color: #64748b; font-size: 11px;">CircleIn by community operations | Transactional email</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const accent = {
  emerald: { from: '#0f766e', to: '#14b8a6', text: '#0f766e' },
  amber: { from: '#b45309', to: '#f59e0b', text: '#b45309' },
  rose: { from: '#be123c', to: '#f43f5e', text: '#be123c' },
  indigo: { from: '#3730a3', to: '#6366f1', text: '#3730a3' },
  cyan: { from: '#0c4a6e', to: '#06b6d4', text: '#0c4a6e' },
};

const bookingDateTimeRows = (data: {
  userName?: string;
  amenityName: string;
  date: string;
  timeSlot: string;
  bookingId?: string;
  bookingReference?: string;
  communityName?: string;
  flatNumber?: string;
}) => {
  const rows: Array<{ label: string; value: string }> = [
    { label: 'Resident', value: data.flatNumber ? `${data.userName || 'Resident'} | Flat ${data.flatNumber}` : data.userName || 'Resident' },
    { label: 'Amenity', value: data.amenityName },
    { label: 'Date', value: normalizeDateLabel(data.date) },
    { label: 'Time', value: data.timeSlot },
  ];

  if (data.communityName) {
    rows.push({ label: 'Community', value: data.communityName });
  }

  const resolvedBookingReference = data.bookingReference || (data.bookingId ? data.bookingId.substring(0, 8).toUpperCase() : undefined);
  if (resolvedBookingReference) {
    rows.push({ label: 'Booking Ref', value: `#${resolvedBookingReference}` });
  }

  return rows;
};

export const emailTemplates = {
  bookingConfirmation: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
    communityName: string;
    flatNumber?: string;
    enhancedSections?: string;
  }): EmailTemplateResult => ({
    subject: `Booking confirmed | ${data.amenityName}`,
    html: renderLayout({
      preheader: `Your ${data.amenityName} booking is confirmed.`,
      eyebrow: 'Booking update',
      title: 'Booking confirmed',
      subtitle: 'Your slot is reserved. See details below.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, your booking has been locked in and is ready.`,
      detailsRows: bookingDateTimeRows(data),
      contentHtml: `
        <section style="margin-top: 22px; border-left: 4px solid ${accent.emerald.from}; background: #ecfeff; border-radius: 10px; padding: 16px;">
          <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 6px;">Before you arrive</div>
          <div style="font-size: 13px; color: #334155; line-height: 1.7;">
            1) Arrive on time to avoid slot loss.<br/>
            2) Bring required accessories for the amenity.<br/>
            3) Cancel early if plans change so others can use the slot.
          </div>
        </section>
        ${data.enhancedSections || ''}
      `,
      cta: { label: 'Open my bookings', url: '/bookings' },
      accent: accent.emerald,
    }),
  }),

  bookingReminder: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
    flatNumber?: string;
  }): EmailTemplateResult => ({
    subject: `Reminder | ${data.amenityName} starts soon`,
    html: renderLayout({
      preheader: `${data.amenityName} starts in about one hour.`,
      eyebrow: '1-hour reminder',
      title: 'You are up next',
      subtitle: 'Your booking starts soon. Plan to be ready.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, this is your reminder that your booking begins shortly.`,
      detailsRows: bookingDateTimeRows(data),
      statusHtml: `
        <section style="margin-top: 20px; padding: 16px; border-radius: 12px; background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b;">
          <div style="font-size: 20px; font-weight: 800; color: #92400e;">Starts in ~1 hour</div>
          <div style="font-size: 13px; color: #78350f; margin-top: 5px;">Traffic, elevator waits, or weather can affect arrival. Leave a bit early.</div>
        </section>
      `,
      cta: { label: 'View booking', url: '/bookings' },
      accent: accent.amber,
    }),
  }),

  bookingCancellation: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingId: string;
    cancelledBy?: string;
    isAdminCancellation?: boolean;
    cancellationReason?: string;
    flatNumber?: string;
  }): EmailTemplateResult => ({
    subject: `Booking cancelled | ${data.amenityName}`,
    html: renderLayout({
      preheader: `${data.amenityName} booking has been cancelled.`,
      eyebrow: 'Booking update',
      title: 'Booking cancelled',
      subtitle: data.isAdminCancellation
        ? `Cancelled by ${data.cancelledBy || 'community administration'}.`
        : 'Cancellation request completed successfully.',
      introHtml: data.isAdminCancellation
        ? `Hi <strong>${escapeHtml(data.userName)}</strong>, your booking was cancelled by administration.`
        : `Hi <strong>${escapeHtml(data.userName)}</strong>, we have processed your cancellation request.`,
      detailsRows: bookingDateTimeRows(data),
      contentHtml: `
        ${
          data.cancellationReason
            ? `<section style="margin-top: 20px; padding: 14px 16px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 10px;"><div style="font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #9a3412; font-weight: 700;">Reason</div><div style="margin-top: 6px; color: #7c2d12; font-size: 13px; line-height: 1.7;">${escapeHtml(data.cancellationReason)}</div></section>`
            : ''
        }
      `,
      cta: { label: 'Book another slot', url: '/bookings' },
      accent: accent.rose,
    }),
  }),

  amenityBlocked: (data: {
    amenityName: string;
    reason: string;
    startDate: string;
    endDate: string;
    communityName: string;
    isFestive?: boolean;
  }): EmailTemplateResult => ({
    subject: `Amenity blocked | ${data.amenityName}`,
    html: renderLayout({
      preheader: `${data.amenityName} is temporarily unavailable.`,
      eyebrow: data.isFestive ? 'Special event update' : 'Operations update',
      title: `${data.amenityName} is temporarily blocked`,
      subtitle: 'Please review dates, reason, and alternatives.',
      introHtml: `This is an operational update for <strong>${escapeHtml(data.communityName)}</strong>.`,
      detailsRows: [
        { label: 'Amenity', value: data.amenityName },
        { label: 'Start', value: normalizeDateLabel(data.startDate) },
        { label: 'End', value: normalizeDateLabel(data.endDate) },
        { label: 'Community', value: data.communityName },
      ],
      contentHtml: `
        <section style="margin-top: 20px; padding: 14px 16px; border-radius: 10px; border: 1px solid #dbeafe; background: #eff6ff;">
          <div style="font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #1d4ed8; font-weight: 700;">Reason</div>
          <div style="margin-top: 6px; color: #1e3a8a; font-size: 13px; line-height: 1.7;">${escapeHtml(data.reason)}</div>
        </section>
      `,
      cta: { label: 'See available amenities', url: '/dashboard' },
      accent: data.isFestive ? accent.amber : accent.indigo,
    }),
  }),

  amenityUnblocked: (data: {
    userName: string;
    amenityName: string;
    communityName: string;
    bookingUrl: string;
    flatNumber?: string;
  }): EmailTemplateResult => ({
    subject: `Amenity available again | ${data.amenityName}`,
    html: renderLayout({
      preheader: `${data.amenityName} is open for bookings now.`,
      eyebrow: 'Availability update',
      title: `${data.amenityName} is back`,
      subtitle: 'Slots are open again and may fill quickly.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>${data.flatNumber ? ` (Flat ${escapeHtml(data.flatNumber)})` : ''}, good news - this amenity is available now.`,
      detailsRows: [
        { label: 'Amenity', value: data.amenityName },
        { label: 'Community', value: data.communityName },
        { label: 'Status', value: 'Open for booking' },
      ],
      cta: { label: 'Book now', url: data.bookingUrl },
      accent: accent.emerald,
    }),
  }),

  bookingWaitlist: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    waitlistPosition: number;
    communityName: string;
  }): EmailTemplateResult => ({
    subject: `Waitlist confirmed | ${data.amenityName}`,
    html: renderLayout({
      preheader: `You are #${data.waitlistPosition} on the waitlist.`,
      eyebrow: 'Waitlist update',
      title: `You are #${data.waitlistPosition} in queue`,
      subtitle: 'We will notify you immediately when a slot opens.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, the requested slot is full, but you are now in the waitlist line.`,
      detailsRows: bookingDateTimeRows({
        userName: data.userName,
        amenityName: data.amenityName,
        date: data.date,
        timeSlot: data.timeSlot,
        communityName: data.communityName,
      }),
      contentHtml: `
        <section style="margin-top: 20px; padding: 14px 16px; border-radius: 10px; border: 1px solid #fcd34d; background: #fef9c3; color: #713f12; font-size: 13px; line-height: 1.7;">
          As soon as someone cancels, we auto-promote from top of queue and send you a confirmation update.
        </section>
      `,
      accent: accent.amber,
    }),
  }),

  waitlistPromoted: (data: {
    userName: string;
    amenityName: string;
    startTime: string;
    endTime: string;
    confirmationUrl: string;
    deadline: string;
    waitlistPosition: number;
    flatNumber?: string;
  }): EmailTemplateResult => ({
    subject: `Spot opened up | Confirm ${data.amenityName}`,
    html: renderLayout({
      preheader: 'A waitlist slot opened and needs your confirmation.',
      eyebrow: 'Waitlist promotion',
      title: 'Your waitlist slot is ready',
      subtitle: 'Confirm quickly before the deadline expires.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, you were promoted from waitlist position #${data.waitlistPosition}.`,
      detailsRows: [
        {
          label: 'Resident',
          value: data.flatNumber ? `${data.userName} | Flat ${data.flatNumber}` : data.userName,
        },
        { label: 'Amenity', value: data.amenityName },
        { label: 'Start', value: data.startTime },
        { label: 'End', value: data.endTime },
        { label: 'Confirm by', value: data.deadline },
      ],
      statusHtml: `
        <section style="margin-top: 20px; padding: 16px; border-radius: 12px; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fdba74;">
          <div style="font-size: 18px; font-weight: 800; color: #9a3412;">Action required</div>
          <div style="font-size: 13px; color: #7c2d12; margin-top: 5px;">If this is not confirmed in time, it goes to the next resident automatically.</div>
        </section>
      `,
      cta: { label: 'Confirm booking', url: data.confirmationUrl },
      accent: accent.emerald,
    }),
  }),

  confirmationReminder: (data: {
    userName: string;
    amenityName: string;
    startTime: string;
    confirmationUrl: string;
    hoursRemaining: number;
  }): EmailTemplateResult => ({
    subject: `Reminder | Confirm ${data.amenityName} (${data.hoursRemaining}h left)`,
    html: renderLayout({
      preheader: `${data.hoursRemaining} hours left to confirm your waitlist slot.`,
      eyebrow: 'Confirmation reminder',
      title: 'Confirmation window closing',
      subtitle: `${data.hoursRemaining} hour(s) remaining before expiry.`,
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, your promoted booking for ${escapeHtml(data.amenityName)} is awaiting confirmation.`,
      detailsRows: [
        { label: 'Amenity', value: data.amenityName },
        { label: 'Start', value: data.startTime },
        { label: 'Time left', value: `${data.hoursRemaining} hour(s)` },
      ],
      cta: { label: 'Confirm now', url: data.confirmationUrl },
      accent: accent.rose,
    }),
  }),

  waitlistAutoPromoted: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    bookingUrl: string;
    flatNumber?: string;
  }): EmailTemplateResult => ({
    subject: `Auto-confirmed | ${data.amenityName}`,
    html: renderLayout({
      preheader: 'A slot opened and your booking is auto-confirmed.',
      eyebrow: 'Auto promotion',
      title: 'You are confirmed automatically',
      subtitle: 'No action needed. Your booking is already active.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>${data.flatNumber ? ` (Flat ${escapeHtml(data.flatNumber)})` : ''}, a slot opened and we confirmed it for you instantly.`,
      detailsRows: bookingDateTimeRows({
        userName: data.userName,
        amenityName: data.amenityName,
        date: data.date,
        timeSlot: data.timeSlot,
      }),
      cta: { label: 'Open booking details', url: data.bookingUrl },
      accent: accent.emerald,
    }),
  }),

  waitlistPromotion: (data: {
    userName: string;
    amenityName: string;
    date: string;
    timeSlot: string;
    confirmationDeadline: string;
    bookingId: string;
    flatNumber?: string;
  }): EmailTemplateResult => ({
    subject: `Spot available | ${data.amenityName}`,
    html: renderLayout({
      preheader: 'A waitlist slot is available and expires soon.',
      eyebrow: 'Waitlist promotion',
      title: 'Spot is available now',
      subtitle: 'Confirm before deadline to keep this slot.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, you are next in line and this slot is now yours to confirm.`,
      detailsRows: [
        ...bookingDateTimeRows({
          userName: data.userName,
          amenityName: data.amenityName,
          date: data.date,
          timeSlot: data.timeSlot,
          bookingId: data.bookingId,
          flatNumber: data.flatNumber,
        }),
        { label: 'Deadline', value: data.confirmationDeadline },
      ],
      cta: { label: 'Confirm booking', url: `/bookings/confirm/${data.bookingId}?action=confirm` },
      accent: accent.amber,
    }),
  }),

  maintenanceStatusUpdate: (data: {
    userName: string;
    requestTitle: string;
    status: string;
    updateNote?: string;
    category?: string;
    priority?: string;
  }): EmailTemplateResult => ({
    subject: `Maintenance update | ${data.requestTitle}`,
    html: renderLayout({
      preheader: `${data.requestTitle} status changed to ${data.status}.`,
      eyebrow: 'Maintenance desk',
      title: 'Maintenance status updated',
      subtitle: 'Track your request progress in real-time.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, your maintenance request received a fresh update.`,
      detailsRows: [
        { label: 'Request', value: data.requestTitle },
        { label: 'Status', value: data.status },
        { label: 'Category', value: data.category || 'General' },
        { label: 'Priority', value: data.priority || 'Medium' },
      ],
      contentHtml: data.updateNote
        ? `<section style="margin-top: 20px; padding: 14px 16px; border-radius: 10px; border: 1px solid #cbd5e1; background: #f8fafc;"><div style="font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; font-weight: 700;">Admin note</div><div style="margin-top: 6px; color: #334155; font-size: 13px; line-height: 1.7;">${escapeHtml(data.updateNote)}</div></section>`
        : '',
      cta: { label: 'Track request', url: '/maintenance' },
      accent: accent.indigo,
    }),
  }),

  bookingRescheduled: (data: {
    userName: string;
    amenityName: string;
    oldDateTime: string;
    newDateTime: string;
    updatedBy: string;
  }): EmailTemplateResult => ({
    subject: `Booking rescheduled | ${data.amenityName}`,
    html: renderLayout({
      preheader: `${data.amenityName} booking has a new schedule.`,
      eyebrow: 'Schedule change',
      title: 'Booking rescheduled',
      subtitle: 'Please check the updated schedule below.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, your booking schedule was updated by ${escapeHtml(data.updatedBy)}.`,
      detailsRows: [
        { label: 'Amenity', value: data.amenityName },
        { label: 'Previous slot', value: data.oldDateTime },
        { label: 'New slot', value: data.newDateTime },
      ],
      cta: { label: 'Open bookings', url: '/bookings' },
      accent: accent.cyan,
    }),
  }),

  weeklyDigest: (data: {
    userName: string;
    communityName: string;
    upcomingBookings: Array<{ amenityName: string; dateLabel: string; timeLabel: string }>;
  }): EmailTemplateResult => {
    const rows = data.upcomingBookings
      .slice(0, 8)
      .map(
        (booking) => `
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700; font-size: 13px;">${escapeHtml(booking.amenityName)}</td>
            <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px; text-align: right;">${escapeHtml(booking.dateLabel)} | ${escapeHtml(booking.timeLabel)}</td>
          </tr>
        `
      )
      .join('');

    const contentHtml = data.upcomingBookings.length
      ? `
        <section style="margin-top: 20px; border: 1px solid #dbe3ee; border-radius: 12px; padding: 14px 16px; background: #f8fafc;">
          <div style="font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: #0f766e; font-weight: 700; margin-bottom: 6px;">Upcoming bookings</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">${rows}</table>
        </section>
      `
      : `
        <section style="margin-top: 20px; border: 1px solid #bae6fd; border-radius: 12px; padding: 14px 16px; background: #ecfeff; color: #0c4a6e; font-size: 13px; line-height: 1.7;">
          No confirmed bookings for the next 7 days. Explore amenities and reserve your preferred slots.
        </section>
      `;

    return {
      subject: `Weekly digest | ${data.communityName}`,
      html: renderLayout({
        preheader: `Your weekly booking snapshot for ${data.communityName}.`,
        eyebrow: 'Weekly digest',
        title: 'Your community week at a glance',
        subtitle: `Bookings and activity highlights for ${data.communityName}.`,
        introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, here is your weekly booking snapshot from CircleIn.`,
        detailsRows: [
          { label: 'Community', value: data.communityName },
          { label: 'Upcoming bookings', value: String(data.upcomingBookings.length) },
        ],
        contentHtml,
        cta: { label: 'Plan this week', url: '/bookings' },
        accent: accent.cyan,
      }),
    };
  },

  communityAnnouncement: (data: {
    userName: string;
    title: string;
    previewText: string;
    authorName: string;
    communityName: string;
    actionUrl?: string;
  }): EmailTemplateResult => ({
    subject: `Community announcement | ${data.title}`,
    html: renderLayout({
      preheader: `New announcement in ${data.communityName}.`,
      eyebrow: 'Community feed',
      title: data.title,
      subtitle: `Published by ${data.authorName}`,
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, your community posted a new update.`,
      detailsRows: [
        { label: 'Community', value: data.communityName },
        { label: 'Author', value: data.authorName },
      ],
      contentHtml: `
        <section style="margin-top: 20px; border: 1px solid #dbe3ee; border-radius: 12px; padding: 14px 16px; background: #f8fafc; color: #334155; font-size: 13px; line-height: 1.7;">
          ${escapeHtml(data.previewText)}
        </section>
      `,
      cta: { label: 'Read announcement', url: data.actionUrl || '/community' },
      accent: accent.indigo,
    }),
  }),

  noShowWarning: (data: {
    userName: string;
    amenityName: string;
    incidentDate: string;
    noShowCount: number;
    suspensionUntil?: string;
  }): EmailTemplateResult => ({
    subject: `Attendance warning | ${data.amenityName}`,
    html: renderLayout({
      preheader: 'A no-show was recorded for your recent booking.',
      eyebrow: 'Policy update',
      title: 'No-show recorded',
      subtitle: 'Please review policy impact and next steps.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, we recorded a no-show for a recent booking.`,
      detailsRows: [
        { label: 'Amenity', value: data.amenityName },
        { label: 'Incident date', value: normalizeDateLabel(data.incidentDate) },
        { label: 'No-show count', value: String(data.noShowCount) },
        ...(data.suspensionUntil
          ? [{ label: 'Suspended until', value: normalizeDateLabel(data.suspensionUntil) }]
          : []),
      ],
      cta: { label: 'Review bookings', url: '/bookings' },
      accent: accent.rose,
    }),
  }),

  securityAlert: (data: {
    userName: string;
    alertTitle: string;
    alertDetails: string;
    occurredAt: string;
    actionUrl?: string;
  }): EmailTemplateResult => ({
    subject: `Security alert | ${data.alertTitle}`,
    html: renderLayout({
      preheader: 'Important security activity detected on your account.',
      eyebrow: 'Security',
      title: data.alertTitle,
      subtitle: 'If this was not you, take action immediately.',
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, we detected a security event that needs your attention.`,
      detailsRows: [
        { label: 'Occurred at', value: data.occurredAt },
      ],
      contentHtml: `
        <section style="margin-top: 20px; border: 1px solid #fecaca; border-radius: 12px; background: #fff1f2; padding: 14px 16px; color: #881337; font-size: 13px; line-height: 1.7;">
          ${escapeHtml(data.alertDetails)}
        </section>
      `,
      cta: { label: 'Secure account', url: data.actionUrl || '/settings' },
      accent: accent.rose,
    }),
  }),

  monthlyCommunityPulse: (data: {
    userName: string;
    communityName: string;
    highlights: string[];
    actionUrl?: string;
  }): EmailTemplateResult => ({
    subject: `Monthly pulse | ${data.communityName}`,
    html: renderLayout({
      preheader: `Monthly highlights from ${data.communityName}.`,
      eyebrow: 'Community pulse',
      title: 'Monthly highlights',
      subtitle: `What moved in ${data.communityName} this month.`,
      introHtml: `Hi <strong>${escapeHtml(data.userName)}</strong>, here is your monthly pulse report.`,
      contentHtml: `
        <section style="margin-top: 20px; border: 1px solid #dbe3ee; border-radius: 12px; background: #f8fafc; padding: 14px 16px;">
          <ul style="margin: 0; padding-left: 18px; color: #334155; font-size: 13px; line-height: 1.8;">
            ${data.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>
      `,
      cta: { label: 'Open community', url: data.actionUrl || '/community' },
      accent: accent.cyan,
    }),
  }),
};

export async function sendEmail(
  options: {
    to: string;
    subject: string;
    html: string;
  },
  retries = 3
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!options.to || !options.to.includes('@')) {
    return { success: false, error: 'Invalid email address' };
  }

  if (!process.env.EMAIL_PASSWORD) {
    return {
      success: false,
      error: 'Email service is not configured. Set EMAIL_PASSWORD.',
    };
  }

  let lastError: any = null;
  const senderEmail = process.env.EMAIL_USER || 'circleinapp1@gmail.com';
  const senderName = process.env.EMAIL_SENDER_NAME || 'CircleIn';

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const info = await transporter.sendMail({
        from: `"${senderName}" <${senderEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: senderEmail,
        priority: 'high',
      });

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      lastError = error;

      if (error?.code === 'EAUTH' || error?.responseCode === 550) {
        break;
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown email delivery error',
  };
}

export async function sendBatchEmails(
  emails: Array<{ to: string; subject: string; html: string }>,
  template: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const chunkSize = 25;
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);

    const settled = await Promise.allSettled(
      chunk.map(async (email) => {
        const result = await sendEmail(email);
        if (!result.success) {
          throw new Error(result.error || 'Unknown batch email error');
        }
      })
    );

    settled.forEach((entry, idx) => {
      if (entry.status === 'fulfilled') {
        results.sent += 1;
      } else {
        results.failed += 1;
        results.errors.push(`[${template}] ${chunk[idx]?.to || 'unknown'}: ${entry.reason?.message || 'failed'}`);
      }
    });
  }

  return results;
}
