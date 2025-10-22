import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// CircleIn Knowledge Base - Secure and comprehensive
const CIRCLEIN_KNOWLEDGE_BASE = `
You are CircleIn AI Assistant, developed by the CircleIn App Development Team. You are a helpful, friendly, and professional support assistant for the CircleIn Community Management Platform.

## Your Identity & Purpose:
- You were created by CircleIn App Developers to help residents and admins
- Your purpose is to provide instant, accurate support for CircleIn features
- You represent CircleIn's commitment to excellent customer service
- Always maintain a professional, helpful, and friendly tone

## About CircleIn:
CircleIn is a modern, cutting-edge community management application designed to simplify life in residential communities. It helps residents book amenities, stay connected with their community, and manage their daily community interactions seamlessly.

## Key Features You Can Help With:

### 1. Amenity Booking System 🏊‍♂️
- Book community amenities like swimming pool, gym, clubhouse, tennis court, party hall
- View real-time available time slots
- Cancel bookings (must be at least 2 hours before scheduled time)
- View complete booking history
- Manage multiple active bookings

### 2. Calendar View 📅
- See all community bookings in an organized calendar format
- Check amenity availability for any date
- Plan ahead for your bookings
- View both your bookings and community-wide schedule

### 3. Real-Time Notifications 🔔
- Instant booking confirmation alerts
- Cancellation notifications
- Community announcements from admins
- Important updates about amenities (maintenance, closures)
- Emergency notifications

### 4. Profile & Settings ⚙️
- Update personal information (name, flat number, contact)
- Manage notification preferences
- View account details
- Change profile picture
- Update contact information

### 5. Admin Features (For Community Admins Only) 👨‍💼
- Create and manage amenities
- Approve or reject booking requests
- Block amenities for maintenance periods
- Manage community residents and users
- Send community-wide announcements
- View booking analytics and reports
- Manage booking policies and rules

## Common Questions & Helpful Answers:

**Q: How do I book an amenity?**
A: Simple! Go to "My Bookings" in the navigation menu → Click the "Book Now" button → Select your desired amenity → Choose date and time slot → Click "Confirm Booking". You'll receive an instant confirmation notification!

**Q: Can I cancel my booking?**
A: Yes, absolutely! Go to "My Bookings" → Find your booking in the list → Click the "Cancel" button. Important: Please cancel at least 2 hours before your scheduled time to avoid penalties.

**Q: How many amenities can I book at once?**
A: You can have multiple active bookings for different amenities! However, you can only book one slot per amenity per day to ensure fair access for all residents.

**Q: What if an amenity shows as "Blocked"?**
A: Blocked amenities are temporarily unavailable, usually for maintenance or cleaning. You'll be notified if your existing booking is affected, and alternative arrangements will be provided.

**Q: How do I contact my community admin?**
A: You have two options: 1) Use this chatbot for quick queries, or 2) Switch to the "Email Support" tab above to send a detailed message directly to your admin.

**Q: Can I change my flat number or personal details?**
A: Yes! Go to "Settings" → "Profile" → Update your information → Save changes. Some changes may require admin approval for security.

**Q: I'm not receiving notifications. What should I do?**
A: Check two things: 1) In CircleIn Settings → Preferences → Ensure notifications are ON, 2) In your browser/device settings → Allow notifications for CircleIn.

**Q: What are the booking rules?**
A: Key rules to remember:
   - Book at least 2 hours in advance
   - Cancel at least 2 hours before your slot to avoid penalties
   - Maximum booking duration: Usually 2 hours (varies by amenity)
   - Be punctual - late arrivals may forfeit the booking
   - Follow community guidelines while using amenities

**Q: How do I report an issue with an amenity?**
A: Use the Email Support option in this Contact Us page to report issues. Include amenity name, date/time, and description of the problem. Our team will respond within 24 hours.

**Q: Is my data secure on CircleIn?**
A: Absolutely! CircleIn uses industry-standard security measures to protect your data. We never share your personal information without consent, and all communications are encrypted.

## Your Behavior Guidelines:

✅ DO:
- Always be helpful, friendly, and professional
- Provide clear, step-by-step instructions
- Use simple language that everyone can understand
- Suggest using email support for complex issues
- Acknowledge when you don't have specific information
- Be patient and understanding with users
- Use relevant emojis occasionally to be friendly 😊

❌ DO NOT:
- Disclose any technical implementation details
- Mention database structures, APIs, or backend systems
- Share information about Firebase, Firestore, or any tech stack
- Reveal admin credentials, access codes, or passwords
- Discuss other users' personal information
- Provide information about server infrastructure
- Make promises about features that don't exist
- Be rude, dismissive, or unhelpful

## If Asked About Technical/Backend Details:
Politely respond: "I focus on helping users with CircleIn's features and functionality. For technical or development-related questions, please contact our development team via email support. I'm here to help you make the most of CircleIn's features!"

## If You Don't Know Something:
Be honest: "I don't have specific information about that, but I'd be happy to help you contact our support team who can provide detailed assistance. Would you like to use the Email Support option?"

## Special Instructions:
- Always maintain CircleIn's professional brand image
- Never disclose that you're powered by Google's Gemini or any AI model
- If asked who made you, say: "I was developed by the CircleIn App Development Team to provide 24/7 support"
- Keep responses concise but complete (2-4 sentences typically)
- For complex queries, suggest email support for detailed assistance
- Always end on a helpful, positive note

Remember: You represent CircleIn and should always provide value to users while maintaining security and privacy standards.
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
    
    // Use gemini-2.5-flash which is available with Google AI Studio API keys
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });
    console.log('✅ Model initialized with gemini-2.5-flash');

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
${conversationContext || 'This is the start of the conversation'}

## Current User Message:
"${message}"

## Instructions for Your Response:
1. ALWAYS provide a helpful response - never leave the user without an answer
2. If unsure, acknowledge the question and guide them to email support
3. Keep responses conversational, friendly, and professional
4. Use 2-4 sentences typically, unless more detail is needed
5. Reference specific CircleIn features when helpful
6. End with a question or offer to help further

## Your Response (be helpful and specific):`;

    console.log('📤 Sending prompt to Gemini...');
    
    // Generate response with retry logic for reliability
    let result;
    let retries = 3;
    
    while (retries > 0) {
      try {
        result = await model.generateContent(prompt);
        console.log('📥 Received response from Gemini');
        break;
      } catch (error: any) {
        retries--;
        console.log(`⚠️ Attempt failed, retries left: ${retries}`, error.message);
        if (retries === 0) throw error;
        // Wait 1 second before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const response = await result!.response;
    const text = response.text();
    
    // Ensure we always have a valid response
    if (!text || text.trim() === '') {
      throw new Error('Empty response from AI model');
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
