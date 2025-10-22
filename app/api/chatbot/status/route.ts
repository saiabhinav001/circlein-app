import { NextRequest, NextResponse } from 'next/server';

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

    // Fetch available models directly from the API
    const modelsResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!modelsResponse.ok) {
      throw new Error(`Failed to fetch models: ${modelsResponse.status}`);
    }
    
    const modelsData = await modelsResponse.json();
    const availableModels = modelsData.models?.map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      supportedMethods: m.supportedGenerationMethods
    })) || [];
    
    // Try to use the first available model that supports generateContent
    const workingModel = availableModels.find((m: any) => 
      m.supportedMethods?.includes('generateContent')
    );
    
    let testResult = null;
    if (workingModel) {
      // Test with the working model
      const modelName = workingModel.name.replace('models/', '');
      const testResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "Hello" in one word.' }] }]
          })
        }
      );
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        testResult = {
          model: modelName,
          status: 'success',
          response: testData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
        };
      }
    }
    
    return NextResponse.json({
      status: testResult ? 'success' : 'error',
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      availableModels: availableModels,
      workingModel: workingModel?.name || null,
      testResult: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      errorName: error.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
