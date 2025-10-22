import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CircleIn Knowledge Base - Secure and comprehensive
const CIRCLEIN_KNOWLEDGE_BASE = `
You are CircleIn AI Assistant, a helpful and friendly support bot for the CircleIn Community Management Platform.

## About CircleIn:
CircleIn is a modern community management application that helps residents book amenities, manage their community interactions, and stay connected.

## Key Features:
1. **Amenity Booking System**
   - Residents can book community amenities (swimming pool, gym, clubhouse, etc.)
   - View available time slots
   - Cancel bookings (with advance notice)
   - View booking history

2. **Calendar View**
   - See all bookings in calendar format
   - Check amenity availability
   - Plan ahead for bookings

3. **Notifications**
   - Real-time booking confirmations
   - Cancellation alerts
   - Community announcements

4. **Settings**
   - Update profile information
   - Manage preferences
   - View account details

5. **Admin Features** (For admins only)
   - Manage amenities
   - Approve/reject bookings
   - Block amenities for maintenance
   - Manage users
   - Send community announcements

## Common Questions & Answers:

**Q: How do I book an amenity?**
A: Go to "My Bookings" → Click "Book Now" → Select amenity, date, and time slot → Confirm booking.

**Q: Can I cancel my booking?**
A: Yes! Go to "My Bookings" → Find your booking → Click "Cancel". Please cancel at least 2 hours before your scheduled time.

**Q: How many amenities can I book at once?**
A: You can have multiple active bookings, but only one booking per amenity per day.

**Q: What if the amenity is blocked?**
A: If an amenity is blocked for maintenance, you'll be notified and your booking will be automatically cancelled.

**Q: How do I contact the admin?**
A: Use the "Contact Us" feature in the navigation menu. You can use the chatbot (me!) or send an email.

**Q: How do I change my flat number?**
A: Go to Settings → Profile → Update your flat number.

**Q: I'm not receiving notifications**
A: Check Settings → Preferences → Ensure notifications are enabled in your browser.

**Q: What are the booking rules?**
A: 
- Book at least 2 hours in advance
- Cancel at least 2 hours before your slot
- Maximum 2 hours per booking
- Be on time for your booking

## Important Guidelines:
- Always be helpful and friendly
- Never disclose technical details about the database or backend
- Never share admin credentials or sensitive information
- If you don't know something, suggest contacting support via email
- Keep responses concise and actionable
- Use emojis sparingly but appropriately 😊

## What NOT to share:
- Database structure or schema
- API endpoints or server details
- Firebase configuration
- Admin passwords or access codes
- Other users' personal information
- Technical implementation details

If asked about technical backend details, politely redirect: "I can't share technical details, but I'm happy to help with using CircleIn features!"
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
    
    // Try different model names in order of preference
    let model;
    try {
      // First try gemini-1.5-pro-latest (most recent stable)
      model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro-latest',
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });
      console.log('✅ Model initialized successfully with gemini-1.5-pro-latest');
    } catch (e) {
      console.log('⚠️ gemini-1.5-pro-latest failed, trying gemini-pro...');
      // Fallback to original gemini-pro
      model = genAI.getGenerativeModel({ 
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.9,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      });
      console.log('✅ Model initialized successfully with gemini-pro');
    }

    // Build conversation context
    const conversationContext = conversationHistory
      ?.slice(-5) // Last 5 messages for context
      .map((msg: any) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    // Build the complete prompt
    const prompt = `${CIRCLEIN_KNOWLEDGE_BASE}

## User Context:
- Role: ${userRole === 'admin' ? 'Community Admin' : 'Resident'}
- Conversation History:
${conversationContext || 'No previous messages'}

## Current User Message:
${message}

## Your Response:
Please provide a helpful, accurate, and concise response based on the CircleIn knowledge base. If the question is outside your knowledge scope, politely suggest using the email support option.`;

    console.log('📤 Sending prompt to Gemini...');
    
    // Generate response
    const result = await model.generateContent(prompt);
    console.log('📥 Received response from Gemini');
    
    const response = await result.response;
    const text = response.text();
    
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
