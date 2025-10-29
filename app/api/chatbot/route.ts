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
    const { message, userRole, conversationHistory } = await request.json();

    // Quick validation
    if (!message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const isAdmin = userRole === 'admin';

    // Try AI response first, with multiple fallback layers
    try {
      // Get pre-initialized model instance
      const model = getModelInstance();

      // Determine user context
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

      // Fast generation with timeout protection - reduced to 5s for faster fallback
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s max

      try {
        const result = await model.generateContent(prompt);
        clearTimeout(timeoutId);
        
        const response = await result.response;
        const text = response.text();
        
        if (!text || text.trim() === '') {
          // Empty response - use fallback
          return NextResponse.json({ 
            response: getFallbackResponse(message, isAdmin)
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
        
        // Timeout or generation error - use intelligent fallback
        console.log('⚠️ AI generation failed, using fallback:', genError.name);
        return NextResponse.json({ 
          response: getFallbackResponse(message, isAdmin)
        });
      }

    } catch (modelError: any) {
      // Model initialization failed - use fallback
      console.log('⚠️ Model initialization failed, using fallback');
      return NextResponse.json({ 
        response: getFallbackResponse(message, isAdmin)
      });
    }

  } catch (error: any) {
    console.error('❌ Chatbot error:', error?.message);
    
    // Last resort - provide generic but helpful fallback
    const isAdmin = error.userRole === 'admin';
    return NextResponse.json({
      response: getFallbackResponse(
        error.message || "help", 
        isAdmin || false
      )
    });
  }
}
