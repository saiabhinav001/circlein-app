import { z } from 'zod';

const BOOKING_SLOT_REGEX = /^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}$/;

export const BookingCreateSchema = z.object({
  amenityId: z.string().min(1).max(100),
  amenityName: z.string().min(1).max(200),
  startTime: z.string().min(1).max(80),
  endTime: z.string().min(1).max(80),
  attendees: z.array(z.string().min(1).max(200)).max(20).optional(),
  selectedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  selectedSlot: z.string().regex(BOOKING_SLOT_REGEX),
  userName: z.string().max(120).optional(),
  userFlatNumber: z.string().max(50).optional(),
});

const MaintenanceCategorySchema = z.enum([
  'Plumbing',
  'Electrical',
  'HVAC',
  'Structural',
  'General',
  'auto',
  'plumbing',
  'electrical',
  'hvac',
  'structural',
  'general',
  '',
]);

export const MaintenanceCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  issue: z.string().max(2000).optional(),
  category: MaintenanceCategorySchema.optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  location: z.string().max(300).optional(),
  imageUrls: z.array(z.string().url()).max(6).optional(),
});

const AnnouncementAttachmentSchema = z.object({
  name: z.string().min(1).max(200),
  url: z.string().url(),
  contentType: z.string().max(120).optional(),
  size: z.number().int().nonnegative().max(10 * 1024 * 1024).optional(),
  isImage: z.boolean().optional(),
});

export const AnnouncementCreateSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  previewText: z.string().max(300).optional(),
  attachments: z.array(AnnouncementAttachmentSchema).max(6).optional(),
});

export const PollCreateSchema = z.object({
  question: z.string().min(5).max(300),
  options: z.array(z.string().min(1).max(100)).min(2).max(6),
  deadline: z.string().min(1),
});
