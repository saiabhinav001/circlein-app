export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent';

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export const SUPPORT_PRIORITY_SLA_HOURS: Record<SupportTicketPriority, number> = {
  low: 72,
  normal: 48,
  high: 24,
  urgent: 8,
};

const PRIORITY_RANK: Record<SupportTicketPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const STATUS_RANK: Record<SupportTicketStatus, number> = {
  open: 1,
  in_progress: 2,
  resolved: 3,
  closed: 4,
};

const URGENT_PATTERNS = [
  /emergency/i,
  /unsafe/i,
  /injury/i,
  /fire/i,
  /flood/i,
  /gas leak/i,
  /security issue/i,
  /medical/i,
];

const HIGH_PATTERNS = [
  /cannot/i,
  /can't/i,
  /unable/i,
  /not working/i,
  /blocked/i,
  /failed/i,
  /payment error/i,
  /double charge/i,
  /chargeback/i,
];

const NORMAL_PATTERNS = [/help/i, /question/i, /clarify/i, /update/i];

export function normalizeSupportPriority(value: unknown): SupportTicketPriority {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'urgent' || normalized === 'high' || normalized === 'normal' || normalized === 'low') {
    return normalized;
  }

  return 'normal';
}

export function getSupportPriorityRank(priority: unknown): number {
  return PRIORITY_RANK[normalizeSupportPriority(priority)];
}

export function getNextSupportPriority(priority: unknown): SupportTicketPriority | null {
  const normalized = normalizeSupportPriority(priority);
  if (normalized === 'low') {
    return 'normal';
  }

  if (normalized === 'normal') {
    return 'high';
  }

  if (normalized === 'high') {
    return 'urgent';
  }

  return null;
}

export function normalizeSupportStatus(value: unknown): SupportTicketStatus {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'open' || normalized === 'in_progress' || normalized === 'resolved' || normalized === 'closed') {
    return normalized;
  }

  return 'open';
}

export function getSupportStatusRank(value: unknown): number {
  return STATUS_RANK[normalizeSupportStatus(value)] || 99;
}

export function inferSupportPriority(params: {
  subject: string;
  message: string;
  category?: string;
}): SupportTicketPriority {
  const subject = params.subject || '';
  const message = params.message || '';
  const category = String(params.category || '').toLowerCase();
  const corpus = `${subject} ${message}`;

  if (category === 'technical' || category === 'billing') {
    if (URGENT_PATTERNS.some((pattern) => pattern.test(corpus))) {
      return 'urgent';
    }
    return 'high';
  }

  if (URGENT_PATTERNS.some((pattern) => pattern.test(corpus))) {
    return 'urgent';
  }

  if (HIGH_PATTERNS.some((pattern) => pattern.test(corpus))) {
    return 'high';
  }

  if (category === 'booking' || category === 'account') {
    return 'normal';
  }

  if (NORMAL_PATTERNS.some((pattern) => pattern.test(corpus))) {
    return 'normal';
  }

  return 'low';
}

export function computeSupportDueAt(createdAt: Date, priority: unknown): Date {
  const normalizedPriority = normalizeSupportPriority(priority);
  const next = new Date(createdAt);
  next.setHours(next.getHours() + SUPPORT_PRIORITY_SLA_HOURS[normalizedPriority]);
  return next;
}

export function toDateValue(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isSupportStatusActive(status: unknown): boolean {
  const normalized = normalizeSupportStatus(status);
  return normalized === 'open' || normalized === 'in_progress';
}

export type SupportSlaState = 'none' | 'on_track' | 'at_risk' | 'overdue' | 'resolved';

export function getSupportSlaState(params: {
  dueAt?: string | Date | null;
  status?: unknown;
  now?: Date;
}): SupportSlaState {
  const status = normalizeSupportStatus(params.status);
  if (status === 'resolved' || status === 'closed') {
    return 'resolved';
  }

  const dueAt = params.dueAt ? toDateValue(params.dueAt) : null;
  if (!dueAt) {
    return 'none';
  }

  const now = params.now || new Date();
  const diffMs = dueAt.getTime() - now.getTime();

  if (diffMs < 0) {
    return 'overdue';
  }

  if (diffMs <= 6 * 60 * 60 * 1000) {
    return 'at_risk';
  }

  return 'on_track';
}

export function getSupportAutoEscalationPriority(params: {
  priority: unknown;
  slaState: SupportSlaState;
}): SupportTicketPriority | null {
  const current = normalizeSupportPriority(params.priority);

  if (params.slaState === 'overdue') {
    return current === 'urgent' ? null : 'urgent';
  }

  if (params.slaState === 'at_risk') {
    return getNextSupportPriority(current);
  }

  return null;
}
