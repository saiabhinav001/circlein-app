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

    // Initialize
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const modelsToTest = [
      'gemini-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];
    
    const testResults: any[] = [];
    
    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello" in one word.');
        const response = await result.response;
        const text = response.text();
        
        testResults.push({
          model: modelName,
          status: 'success',
          response: text
        });
        
        // If we found a working model, stop testing
        break;
      } catch (error: any) {
        testResults.push({
          model: modelName,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      status: testResults.some(r => r.status === 'success') ? 'success' : 'error',
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      testResults: testResults,
      timestamp: new Date().toISOString()
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
