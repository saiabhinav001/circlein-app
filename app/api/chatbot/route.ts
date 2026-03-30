import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChatbotRequestSchema } from '@/lib/schemas';
import { adminDb } from '@/lib/firebase-admin';
import { checkRateLimit, getClientIP } from '@/lib/rate-limiter';
import { formatDateInTimeZone, resolveTimeZone } from '@/lib/timezone';

// CircleIn Knowledge Base - Dynamic and Role-Aware
const CIRCLEIN_KNOWLEDGE_BASE = `
You are CircleIn AI Assistant, a helpful and friendly support assistant for CircleIn - a modern community management platform.

## Your Personality:
- Warm, conversational, and genuinely helpful
- Natural and human-like in responses
- Concise but complete (1-3 sentences typically)
- Use simple, everyday language
- Occasional friendly emojis when appropriate 😊

## About CircleIn:
CircleIn helps communities manage amenity bookings, stay connected, and simplify community living.

## Core Features:

### FOR RESIDENTS 🏠
**Amenity Booking:** Book facilities like pool, gym, clubhouse, tennis court. Go to "My Bookings" → "Book Now" → select amenity & time → confirm.
**Calendar View:** See all bookings in an organized calendar.
**Notifications:** Get instant alerts for bookings and announcements.
**Profile:** Update your details in Settings.

### FOR ADMINS 👨‍💼
**All Resident Features PLUS:**
- **Manage Amenities:** Add/edit/delete amenities, set availability, block slots for maintenance
- **Booking Management:** View all resident bookings, approve/cancel as needed
- **Send Announcements:** Broadcast messages to entire community or specific residents
- **User Management:** View resident profiles, manage access
- **Analytics:** View booking statistics and community engagement

## Quick Help:

**Book Amenity:** My Bookings → Book Now → pick amenity/time → confirm
**Cancel Booking:** My Bookings → find booking → Cancel
**Admin Send Announcement:** (Admins only) Notifications → Send Announcement → compose → send
**Admin Block Slot:** (Admins only) Manage Amenities → select amenity → Block Time
**Update Profile:** Settings → Profile → edit → save

## Important Principles:
✅ Tailor responses based on user role (admin vs resident)
✅ Keep answers brief and actionable
✅ Acknowledge community-specific policies vary
✅ Be honest when you don't know specifics

❌ Never share technical details (backend, APIs, databases)
❌ Never share credentials or sensitive info
❌ Don't make up specific community rules

## When You Don't Know:
"Since [policies/details] vary by community, check with your admin or use Email Support for specific information."
`;

// Singleton pattern for model initialization - prevents re-initialization on every request
let modelInstance: any = null;
let genAIInstance: any = null;

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ParsedBookingIntent {
  isBookingIntent: boolean;
  amenityQuery: string | null;
  datePhrase: string | null;
  timePhrase: string | null;
}

interface AmenityDoc {
  id: string;
  name?: string;
  title?: string;
  category?: string;
  communityId?: string;
  timeSlots?: string[];
  weekdaySlots?: string[];
  weekendSlots?: string[];
  booking?: {
    slotDuration?: number;
  };
  operatingHours?: {
    start: string;
    end: string;
  };
  weekdayHours?: {
    start: string;
    end: string;
  };
  weekendHours?: {
    start: string;
    end: string;
  };
}

function getModelInstance() {
  const externalAiEnabled = process.env.ENABLE_EXTERNAL_AI === 'true';
  if (!externalAiEnabled) {
    throw new Error('External AI disabled by configuration');
  }

  if (!modelInstance || !genAIInstance) {
    let apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('GEMINI_API_KEY not configured');
    }
    
    // Remove quotes if present (common issue in .env files)
    apiKey = apiKey.replace(/^["']|["']$/g, '').trim();
    
    genAIInstance = new GoogleGenerativeAI(apiKey);
    modelInstance = genAIInstance.getGenerativeModel({ 
      model: 'gemini-2.5-flash',  // Latest stable Gemini 2.5 Flash - Fast and powerful
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,  // More tokens for detailed responses
      },
    });
  }
  return modelInstance;
}

function parseBookingIntent(message: string): ParsedBookingIntent {
  const isBookingIntent = /(book|reserve|schedule)\b/i.test(message);
  if (!isBookingIntent) {
    return {
      isBookingIntent: false,
      amenityQuery: null,
      datePhrase: null,
      timePhrase: null,
    };
  }

  const amenityMatch = message.match(/(?:book|reserve|schedule)\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+(?:for|at|on)\b|$)/i);
  const dateMatch = message.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
  const timeMatch =
    message.match(/(?:at|for)\s+(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?)?)/i) ||
    message.match(/\b(\d{1,2}(?::\d{2})?\s*(?:a\.?\s*m\.?|p\.?\s*m\.?))\b/i);

  return {
    isBookingIntent,
    amenityQuery: amenityMatch?.[1]?.trim() || null,
    datePhrase: dateMatch?.[1]?.trim() || null,
    timePhrase: timeMatch?.[1]?.trim() || null,
  };
}

function parseDatePhrase(datePhrase: string | null): Date {
  const now = new Date();
  const lower = (datePhrase || 'tomorrow').toLowerCase();
  const target = new Date(now);
  target.setHours(0, 0, 0, 0);

  if (lower === 'today') {
    return target;
  }

  if (lower === 'tomorrow') {
    target.setDate(target.getDate() + 1);
    return target;
  }

  const dayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  const requestedDay = dayMap[lower];
  if (requestedDay === undefined) {
    target.setDate(target.getDate() + 1);
    return target;
  }

  const currentDay = target.getDay();
  let diff = (requestedDay - currentDay + 7) % 7;
  if (diff === 0) {
    diff = 7;
  }
  target.setDate(target.getDate() + diff);
  return target;
}

function parseTimePhrase(timePhrase: string | null): { hour: number; minute: number } | null {
  if (!timePhrase) {
    return null;
  }

  // Normalize voice variants like "3 p.m.", "3 P M", "3pm" into a predictable token.
  const normalizedTime = timePhrase
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b([ap])\s*m\b/g, '$1m');

  const match = normalizedTime.match(/^(\d{1,2})(?::(\d{2}))?\s*([ap]m)?$/i);
  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const suffix = match[3];

  if (Number.isNaN(hour) || Number.isNaN(minute) || minute > 59) {
    return null;
  }

  if (suffix === 'pm' && hour < 12) {
    hour += 12;
  }
  if (suffix === 'am' && hour === 12) {
    hour = 0;
  }

  if (hour > 23) {
    return null;
  }

  return { hour, minute };
}

function generateTimeSlots(startHour: string, endHour: string, durationHours: number): string[] {
  const [startH, startM] = startHour.split(':').map(Number);
  const [endH, endM] = endHour.split(':').map(Number);
  const slotDurationMinutes = Math.max(30, Math.round((durationHours || 1) * 60));
  const slots: string[] = [];

  let currentMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);

  while (currentMinutes + slotDurationMinutes <= endMinutes) {
    const slotStartHour = Math.floor(currentMinutes / 60);
    const slotStartMinute = currentMinutes % 60;
    const slotEndMinutes = currentMinutes + slotDurationMinutes;
    const slotEndHour = Math.floor(slotEndMinutes / 60);
    const slotEndMinute = slotEndMinutes % 60;

    slots.push(
      `${String(slotStartHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}-${String(slotEndHour).padStart(2, '0')}:${String(slotEndMinute).padStart(2, '0')}`
    );

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

function getAmenitySlotsForDate(amenity: AmenityDoc, date: Date): string[] {
  const day = date.getDay();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend && amenity.weekendSlots?.length) {
    return amenity.weekendSlots;
  }
  if (!isWeekend && amenity.weekdaySlots?.length) {
    return amenity.weekdaySlots;
  }
  if (amenity.timeSlots?.length) {
    return amenity.timeSlots;
  }

  const duration = amenity.booking?.slotDuration || 1;
  if (isWeekend && amenity.weekendHours) {
    return generateTimeSlots(amenity.weekendHours.start, amenity.weekendHours.end, duration);
  }
  if (!isWeekend && amenity.weekdayHours) {
    return generateTimeSlots(amenity.weekdayHours.start, amenity.weekdayHours.end, duration);
  }
  if (amenity.operatingHours) {
    return generateTimeSlots(amenity.operatingHours.start, amenity.operatingHours.end, duration);
  }

  return [];
}

function resolveAmenity(amenities: AmenityDoc[], amenityQuery: string | null): AmenityDoc | null {
  if (!amenityQuery) {
    return null;
  }

  const normalized = amenityQuery.toLowerCase().trim();
  if (!normalized) {
    return null;
  }

  let bestMatch: AmenityDoc | null = null;
  let bestScore = -1;

  for (const amenity of amenities) {
    const name = (amenity.name || amenity.title || '').toLowerCase();
    const category = (amenity.category || '').toLowerCase();
    let score = 0;

    if (name === normalized || category === normalized) {
      score = 100;
    } else if (name.includes(normalized) || normalized.includes(name)) {
      score = 70;
    } else if (category && (category.includes(normalized) || normalized.includes(category))) {
      score = 60;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = amenity;
    }
  }

  return bestScore >= 60 ? bestMatch : null;
}

function pickBestSlot(slots: string[], targetHour: number, targetMinute: number): string | null {
  if (!slots.length) {
    return null;
  }

  const targetTotalMinutes = targetHour * 60 + targetMinute;
  let bestSlot: string | null = null;
  let bestDiff = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const [slotStart] = slot.split('-');
    if (!slotStart) {
      continue;
    }
    const [h, m] = slotStart.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) {
      continue;
    }
    const slotMinutes = h * 60 + m;
    const diff = Math.abs(slotMinutes - targetTotalMinutes);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSlot = slot;
    }
  }

  return bestSlot;
}

function parseSlotRange(selectedDate: Date, selectedSlot: string): { start: Date; end: Date } | null {
  const [slotStart, slotEnd] = selectedSlot.split('-');
  if (!slotStart || !slotEnd) {
    return null;
  }

  const [startHours, startMinutes] = slotStart.split(':').map(Number);
  const [endHours, endMinutes] = slotEnd.split(':').map(Number);

  if (
    Number.isNaN(startHours) || Number.isNaN(startMinutes) ||
    Number.isNaN(endHours) || Number.isNaN(endMinutes)
  ) {
    return null;
  }

  const start = new Date(selectedDate);
  const end = new Date(selectedDate);
  start.setHours(startHours, startMinutes, 0, 0);
  end.setHours(endHours, endMinutes, 0, 0);

  return { start, end };
}

async function tryCreateBookingFromIntent(
  request: NextRequest,
  intent: ParsedBookingIntent,
  session: any
): Promise<{ response: string; actionUrl?: string } | null> {
  if (!intent.isBookingIntent) {
    return null;
  }

  if (!session?.user?.email || !session?.user?.communityId) {
    return {
      response: 'Please sign in again before I can create bookings for you.',
    };
  }

  const amenitiesSnapshot = await getDocs(
    query(
      collection(db, 'amenities'),
      where('communityId', '==', session.user.communityId),
      limit(100)
    )
  );

  const amenities = amenitiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<AmenityDoc, 'id'>),
  }));

  if (!amenities.length) {
    return {
      response: 'I could not find any amenities in your community yet. Please ask your admin to set them up first.',
    };
  }

  const amenity = resolveAmenity(amenities, intent.amenityQuery);
  if (!amenity) {
    const sampleNames = amenities
      .slice(0, 4)
      .map((a) => a.name || a.title || 'Amenity')
      .join(', ');
    return {
      response: `I could not identify that amenity. Try one of these: ${sampleNames}.`,
    };
  }

  const desiredTime = parseTimePhrase(intent.timePhrase);
  if (!desiredTime) {
    return {
      response: 'I can do that. What time should I book it for? For example: 3 PM.',
    };
  }

  const bookingDate = parseDatePhrase(intent.datePhrase);
  const slots = getAmenitySlotsForDate(amenity, bookingDate);

  if (!slots.length) {
    return {
      response: `I could not find configured time slots for ${amenity.name || amenity.title || 'that amenity'} right now.`,
    };
  }

  const selectedSlot = pickBestSlot(slots, desiredTime.hour, desiredTime.minute);
  if (!selectedSlot) {
    return {
      response: 'I could not map that time to an available slot. Please try another time.',
    };
  }

  const range = parseSlotRange(bookingDate, selectedSlot);
  if (!range) {
    return {
      response: 'I could not parse the booking slot format. Please try again.',
    };
  }

  const bookingResponse = await fetch(`${request.nextUrl.origin}/api/bookings/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') || '',
    },
    body: JSON.stringify({
      amenityId: amenity.id,
      amenityName: amenity.name || amenity.title || 'Amenity',
      startTime: range.start.toISOString(),
      endTime: range.end.toISOString(),
      attendees: [],
      selectedDate: range.start.toISOString(),
      selectedSlot,
      userName: session.user.name || session.user.email.split('@')[0],
      userFlatNumber: (session.user as any).flatNumber || '',
    }),
  });

  const bookingData = await bookingResponse.json();

  if (!bookingResponse.ok) {
    const errorMessage = bookingData?.message || bookingData?.error || 'Booking failed.';
    return {
      response: `I tried booking ${amenity.name || amenity.title || 'that amenity'}, but it failed: ${errorMessage}`,
    };
  }

  if (bookingData?.status === 'waitlist') {
    return {
      response: `Done. I added you to the waitlist for ${(amenity.name || amenity.title || 'the amenity')} at ${selectedSlot}. You are #${bookingData?.position || '?'}.`,
      actionUrl: '/bookings',
    };
  }

  const settingsSnapshot = await getDoc(doc(db, 'settings', session.user.communityId));
  const settingsData = settingsSnapshot.data() as any;
  const communityTimeZone = resolveTimeZone(settingsData?.community?.timezone || settingsData?.timezone);

  return {
    response: `Booked successfully. ${(amenity.name || amenity.title || 'Amenity')} is reserved for ${selectedSlot} on ${formatDateInTimeZone(bookingDate, communityTimeZone, { month: 'long', day: 'numeric', year: 'numeric' })}.`,
    actionUrl: '/bookings',
  };
}

// Fallback responses for when AI is unavailable - ensures chatbot ALWAYS responds
function getFallbackResponse(message: string, isAdmin: boolean): string {
  const lowerMessage = message.toLowerCase();
  
  // Booking questions
  if (lowerMessage.includes('book') || lowerMessage.includes('reservation')) {
    return "To book an amenity: Go to 'My Bookings' → Click 'Book Now' → Select your amenity and time slot → Confirm your booking. You'll get a confirmation notification! 📅";
  }
  
  // Cancel questions
  if (lowerMessage.includes('cancel')) {
    return "To cancel a booking: Go to 'My Bookings' → Find your booking in the list → Click the 'Cancel' button. You can cancel anytime before your booking time! ❌";
  }
  
  // Admin features
  if (isAdmin && (lowerMessage.includes('admin') || lowerMessage.includes('manage'))) {
    return "As an admin, you can: Manage amenities (add/edit/delete), view all bookings, send announcements to the community, block time slots for maintenance, and manage users. Check the Admin Panel for all features! 👨‍💼";
  }
  
  // Announcement questions
  if (isAdmin && lowerMessage.includes('announcement')) {
    return "To send announcements: Go to 'Notifications' → Click 'Send Announcement' → Write your message → Choose recipients (all or specific residents) → Send! 📢";
  }
  
  // Calendar/schedule
  if (lowerMessage.includes('calendar') || lowerMessage.includes('schedule')) {
    return "View all bookings in the Calendar section! You'll see when amenities are available, your upcoming bookings, and community events. Click any booking to see details. 📆";
  }
  
  // Profile/settings
  if (lowerMessage.includes('profile') || lowerMessage.includes('setting')) {
    return "Update your profile in Settings: Go to 'Settings' → 'Profile' → Edit your details (name, contact info, etc.) → Save changes. Keep your info current! ⚙️";
  }
  
  // Notifications
  if (lowerMessage.includes('notification') || lowerMessage.includes('alert')) {
    return "You'll receive notifications for: Booking confirmations, cancellations, community announcements, and important updates. Check the Notifications page to see all messages! 🔔";
  }
  
  // Amenities
  if (lowerMessage.includes('amenity') || lowerMessage.includes('amenities') || lowerMessage.includes('facilities')) {
    return "CircleIn typically includes amenities like: Swimming Pool, Gym, Tennis Court, Clubhouse, and more. Check 'My Bookings' → 'Book Now' to see available amenities in your community! 🏊‍♂️";
  }
  
  // Help/how to
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return "I'm here to help with booking amenities, viewing your calendar, managing your profile, and understanding CircleIn features. What would you like to know more about? 😊";
  }
  
  // Default friendly response
  return "I'm your CircleIn assistant! I can help you with booking amenities, viewing your calendar, managing your profile, and more. What would you like to know? Feel free to ask about specific features! 💡";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = getClientIP(request);
    const rateLimit = await checkRateLimit(adminDb, `${ip}_chatbot`, {
      maxRequests: 20,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Chatbot rate limit reached. Please wait before sending more messages.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsedBody = ChatbotRequestSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid chatbot request payload', details: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { message, conversationHistory = [] } = parsedBody.data;
    const normalizedMessage = message.trim();
    const sessionRole = (session.user as any).role;
    const isAdmin = sessionRole === 'admin' || sessionRole === 'super_admin';

    const parsedIntent = parseBookingIntent(normalizedMessage);
    if (parsedIntent.isBookingIntent) {
      try {
        const bookingResult = await tryCreateBookingFromIntent(request, parsedIntent, session);
        if (bookingResult) {
          return NextResponse.json(bookingResult);
        }
      } catch (bookingError: any) {
        console.error('Booking intent execution failed:', bookingError?.message || bookingError);
      }
    }

    // Try AI response first, with multiple fallback layers
    try {
      // Get pre-initialized model instance
      const model = getModelInstance();

      // Determine user context
      const roleContext = isAdmin 
        ? '\n\n**USER ROLE: ADMIN** - This user has administrative privileges. Mention admin-specific features when relevant (manage amenities, send announcements, view all bookings, etc.).'
        : '\n\n**USER ROLE: RESIDENT** - This is a regular community member. Focus on resident features (booking amenities, viewing calendar, managing their profile).';

      // Build minimal conversation context (last 3 messages only for speed)
      const conversationContext = (conversationHistory as ConversationMessage[] | undefined)
        ?.slice(-3)
        .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n') || '';

      // Optimized prompt for instant responses
      const prompt = `${CIRCLEIN_KNOWLEDGE_BASE}${roleContext}

${conversationContext ? `Recent conversation:\n${conversationContext}\n` : ''}
User: ${normalizedMessage}

Respond naturally and concisely (1-3 sentences). Be helpful and specific to their role.
Assistant:`;

      // Enforce a hard timeout so fallback responses remain fast and deterministic.

      try {
        const result = (await Promise.race([
          model.generateContent(prompt),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('generation_timeout')), 5000)
          ),
        ])) as any;
        
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim() === '') {
          // Empty response - use fallback
          return NextResponse.json({ 
            response: getFallbackResponse(normalizedMessage, isAdmin)
          });
        }
        
        // Quick security check
        const sensitivePatterns = [
          /firebase/i, /database/i, /api[_-]?key/i, /password/i, 
          /credential/i, /mongodb/i, /firestore/i, /collection/i, /schema/i
        ];

        const sanitizedResponse = sensitivePatterns.some(pattern => pattern.test(text))
          ? "I notice your question involves technical details. For security, I can only help with using CircleIn features. Try rephrasing or contact support via email."
          : text;

        return NextResponse.json({ response: sanitizedResponse, actionUrl: undefined });
      } catch (genError: any) {
        // Timeout or generation error - use intelligent fallback
        return NextResponse.json({ 
          response: getFallbackResponse(normalizedMessage, isAdmin),
          actionUrl: undefined,
        });
      }

    } catch (modelError: any) {
      // Model initialization failed - use fallback
      return NextResponse.json({ 
        response: getFallbackResponse(normalizedMessage, isAdmin),
        actionUrl: undefined,
      });
    }

  } catch {
    return NextResponse.json({
      response: getFallbackResponse('help', false),
      actionUrl: undefined,
    });
  }
}
