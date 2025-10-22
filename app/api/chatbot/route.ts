import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CircleIn Knowledge Base - Dynamic and Community-Aware
const CIRCLEIN_KNOWLEDGE_BASE = `
You are CircleIn AI Assistant, a helpful and friendly support assistant for CircleIn - a modern community management platform.

## Your Personality:
- Warm, conversational, and genuinely helpful
- Natural and human-like in responses
- Concise but complete (2-3 sentences typically)
- Use simple, everyday language
- Occasional friendly emojis when appropriate 😊

## About CircleIn:
CircleIn helps residents easily book community amenities, stay connected with neighbors, and manage community life seamlessly. It's designed to make community living simple and enjoyable.

## Core Features:

### Amenity Booking 🏊‍♂️
Book facilities like swimming pool, gym, clubhouse, tennis court, or party hall. Just go to "My Bookings" → "Book Now" → select amenity, date, and time → confirm. You'll get instant confirmation!

### Calendar View 📅
See all bookings in an organized calendar. Check what's available and plan your bookings ahead.

### Notifications 🔔
Get instant alerts for booking confirmations, cancellations, and important community announcements.

### Your Profile ⚙️
Update your details, manage preferences, and view your account information in Settings.

### Admin Tools 👨‍💼
(For admins only) Manage amenities, handle booking requests, block slots for maintenance, send announcements, and oversee community operations.

## Common Help Topics:

**Booking an Amenity:**
Easy! Go to "My Bookings" → "Book Now" → pick your amenity and time slot → confirm. Done!

**Canceling a Booking:**
No problem! Find your booking in "My Bookings" → click "Cancel". Just make sure to cancel with enough advance notice (check your community's policy).

**Multiple Bookings:**
You can book different amenities, but typically one slot per amenity per day to keep things fair for everyone.

**Blocked Amenities:**
These are temporarily unavailable, usually for maintenance or cleaning. If it affects your booking, you'll be notified.

**Contact Admin:**
You can reach out through this chat for quick help, or use the "Email Support" tab above for detailed queries.

**Update Details:**
Go to Settings → Profile → update your information → save. Some changes might need admin approval.

**Notification Issues:**
Check: 1) CircleIn Settings → ensure notifications are ON, 2) Browser settings → allow notifications for CircleIn.

**Booking Guidelines:**
Most communities require booking in advance and timely cancellations. Specific rules (like advance booking time, cancellation penalties, slot duration) vary by community - check with your admin for details.

## Important Principles:

✅ Always respond naturally and helpfully
✅ Keep answers conversational and brief
✅ Acknowledge when specific info varies by community
✅ Guide users step-by-step for tasks
✅ Suggest email support for complex/specific issues
✅ Be honest when you don't know something specific

❌ Never share technical backend details
❌ No database, API, or infrastructure information
❌ No credentials, passwords, or access codes
❌ No other users' personal information
❌ Don't make up specific rules - they vary by community

## When Asked About You:
"I'm CircleIn's AI assistant, created by the CircleIn development team to help you 24/7 with all things CircleIn!"

## When You Don't Know:
"That's a great question! Since [policies/rules/details] vary by community, I'd recommend checking with your admin or using the Email Support option for specific information about your community."

## Community-Specific Awareness:
Remember that rules, penalties, booking policies, and amenity availability are unique to each community. Always acknowledge this when relevant rather than giving generic rules.
`;

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Chatbot API called');
    
    const { message, userRole, conversationHistory } = await request.json();
    console.log('📝 Request data:', { message: message?.substring(0, 50), userRole, historyLength: conversationHistory?.length });

    if (!message?.trim()) {
      console.error('❌ Empty message received');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ GEMINI_API_KEY is not configured');
      console.error('❌ Environment check:', { 
        hasKey: !!apiKey, 
        keyLength: apiKey?.length,
        nodeEnv: process.env.NODE_ENV 
      });
      return NextResponse.json(
        { error: 'AI service is not configured. Please contact support.' },
        { status: 500 }
      );
    }

    console.log('✅ API key verified:', { 
      length: apiKey.length, 
      prefix: apiKey.substring(0, 10) + '...',
      suffix: '...' + apiKey.substring(apiKey.length - 5)
    });

    // Initialize Gemini AI with API key
    console.log('🔧 Initializing Gemini AI...');
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-2.5-flash optimized for speed and quality
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,  // More focused responses
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,  // Shorter for faster responses
      },
    });
    console.log('✅ Model initialized with gemini-2.5-flash');

    // Build conversation context for natural flow
    const conversationContext = conversationHistory
      ?.slice(-5) // Last 5 messages for context
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`)
      .join('\n');

    // Build the complete prompt for natural, helpful responses
    const prompt = `${CIRCLEIN_KNOWLEDGE_BASE}

## Current Conversation:
${conversationContext || 'User is starting a new conversation'}

User's latest message: "${message}"

Respond naturally as CircleIn's helpful assistant. Be conversational, brief (2-3 sentences), and directly answer their question. If it's a greeting, respond warmly. If it's about community-specific policies (like penalties, booking times, or rules), acknowledge these vary by community and suggest checking with their admin.

Your response:`;

    console.log('📤 Sending prompt to Gemini...');
    
    // Generate response - fast and direct (no retry delays for real-time feel)
    const result = await model.generateContent(prompt);
    console.log('📥 Received response from Gemini');
    
    const response = await result.response;
    const text = response.text();
    
    // Ensure we have a valid response
    if (!text || text.trim() === '') {
      console.error('⚠️ Empty response received');
      return NextResponse.json({ 
        response: "I'm here to help! Could you rephrase your question or let me know what you'd like assistance with?" 
      });
    }
    
    console.log('✅ Response text extracted:', { 
      length: text.length, 
      preview: text.substring(0, 100) 
    });

    // Security check - ensure no sensitive info is leaked
    const sensitivePatterns = [
      /firebase/i,
      /database/i,
      /api[_-]?key/i,
      /password/i,
      /credential/i,
      /mongodb/i,
      /firestore/i,
      /collection/i,
      /schema/i
    ];

    let sanitizedResponse = text;
    
    // If response contains sensitive terms, use a safe fallback
    if (sensitivePatterns.some(pattern => pattern.test(text))) {
      console.log('⚠️ Sensitive content detected, using safe response');
      sanitizedResponse = "I notice your question involves technical details that I cannot discuss for security reasons. However, I'm happy to help with using CircleIn features! Could you rephrase your question, or would you like to contact our support team via email?";
    }

    console.log('✅ Returning response to client');
    return NextResponse.json({ response: sanitizedResponse });

  } catch (error: any) {
    console.error('❌ Chatbot error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.substring(0, 200)
    });
    
    // Handle specific error types
    if (error.message?.includes('API key') || error.message?.includes('API_KEY_INVALID')) {
      console.error('❌ API Key error detected');
      return NextResponse.json(
        { error: 'AI service configuration error. Please contact support.' },
        { status: 500 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.error('❌ Quota exceeded');
      return NextResponse.json(
        { error: 'Service temporarily unavailable. Please try again in a moment.' },
        { status: 429 }
      );
    }

    console.error('❌ Generic error occurred');
    console.error('❌ Full error:', JSON.stringify({
      message: error.message,
      name: error.name,
      cause: error.cause,
      status: error.status
    }, null, 2));
    
    return NextResponse.json(
      { 
        error: 'Failed to generate response. Please try again or use email support.',
        details: error.message,
        errorType: error.name
      },
      { status: 500 }
    );
  }
}
