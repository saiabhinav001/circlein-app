import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'GEMINI_API_KEY not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test the API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Say "Hello! Chatbot is working!" in one sentence.');
    const response = await result.response;
    const text = response.text();
    
    return NextResponse.json({
      status: 'success',
      message: 'Chatbot API is working correctly',
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      modelUsed: 'gemini-1.5-flash',
      testResponse: text,
      timestamp: new Date().toISOString(),
      deployment: 'latest'
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      errorName: error.name,
      errorStatus: error.status,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
