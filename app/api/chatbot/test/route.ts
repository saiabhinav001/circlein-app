import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Health check endpoint for Chatbot API
 * Tests if Gemini API is working correctly
 * 
 * Usage: GET /api/chatbot/test
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Chatbot API...');

    // Check if Gemini API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      console.error('❌ Test failed: API key not configured');
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY not configured',
        details: 'Environment variable is missing'
      }, { status: 500 });
    }

    console.log('✅ API key found:', { 
      length: apiKey.length,
      preview: apiKey.substring(0, 10) + '...'
    });

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
    // Try gemini-1.5-pro model (newer, more stable)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    console.log('✅ Model initialized with gemini-1.5-pro, testing with simple prompt...');

    // Test with a simple prompt
    const result = await model.generateContent('Say "Hello! CircleIn chatbot is working!" in a friendly way.');
    const response = await result.response;
    const text = response.text();

    console.log('✅ Test successful! Response:', text.substring(0, 100));

    return NextResponse.json({
      success: true,
      message: 'Chatbot API is working correctly',
      testResponse: text,
      apiKeyStatus: 'Configured and valid',
      modelUsed: 'gemini-1.5-pro',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      errorName: error.name,
      details: 'Gemini API call failed',
      troubleshooting: [
        'Check if GEMINI_API_KEY is set in Vercel environment variables',
        'Verify the API key is valid in Google AI Studio',
        'Check if Gemini API is enabled for your project',
        'Ensure there are no quota limits reached'
      ]
    }, { status: 500 });
  }
}
