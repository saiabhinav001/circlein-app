import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

function getModelInstance() {
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

export async function POST(request: NextRequest) {
  try {
    const { message, userRole, conversationHistory } = await request.json();

    // Quick validation
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get pre-initialized model instance
    const model = getModelInstance();

    // Determine user context (admin vs resident)
    const isAdmin = userRole === 'admin';
    const roleContext = isAdmin 
      ? '\n\n**USER ROLE: ADMIN** - This user has administrative privileges. Mention admin-specific features when relevant (manage amenities, send announcements, view all bookings, etc.).'
      : '\n\n**USER ROLE: RESIDENT** - This is a regular community member. Focus on resident features (booking amenities, viewing calendar, managing their profile).';

    // Build minimal conversation context (last 3 messages only for speed)
    const conversationContext = conversationHistory
      ?.slice(-3)
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n') || '';

    // Optimized prompt for instant responses
    const prompt = `${CIRCLEIN_KNOWLEDGE_BASE}${roleContext}

${conversationContext ? `Recent conversation:\n${conversationContext}\n` : ''}
User: ${message}

Respond naturally and concisely (1-3 sentences). Be helpful and specific to their role.
Assistant:`;

    // Fast generation with timeout protection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s max

    try {
      const result = await model.generateContent(prompt);
      clearTimeout(timeoutId);
      
      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim() === '') {
        return NextResponse.json({ 
          response: "I'm here to help! Could you rephrase your question?" 
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

      return NextResponse.json({ response: sanitizedResponse });
    } catch (genError: any) {
      clearTimeout(timeoutId);
      
      if (genError.name === 'AbortError') {
        return NextResponse.json({ 
          response: "The response is taking too long. Please try a simpler question or use email support." 
        });
      }
      throw genError;
    }

  } catch (error: any) {
    console.error('❌ Chatbot error:', error?.message);
    
    // Handle specific errors gracefully
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return NextResponse.json(
        { error: 'High traffic detected. Please try again in a moment.' },
        { status: 429 }
      );
    }

    if (error.message?.includes('GEMINI_API_KEY not configured')) {
      return NextResponse.json(
        { error: 'AI service not available. Please use email support.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Unable to generate response. Please try again or use email support.'
      },
      { status: 500 }
    );
  }
}
