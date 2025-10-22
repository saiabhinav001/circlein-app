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

    // Initialize and list available models
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try to list models
    let availableModels: string[] = [];
    try {
      const models = await genAI.listModels();
      availableModels = models.map((m: any) => m.name || m.model);
    } catch (e: any) {
      console.error('Failed to list models:', e.message);
    }
    
    // Try different model names
    const modelsToTest = [
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-001',
      'gemini-1.0-pro',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'models/gemini-1.5-flash',
      'models/gemini-pro'
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
      availableModels: availableModels,
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
