import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function sanitizeApiKey(raw: string | undefined): string {
  if (!raw) {
    return '';
  }
  return raw.replace(/^["']|["']$/g, '').trim();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 7000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    const externalAiEnabled = process.env.ENABLE_EXTERNAL_AI === 'true';
    if (!externalAiEnabled) {
      return NextResponse.json({
        status: 'disabled',
        message: 'External AI is disabled by configuration',
        timestamp: new Date().toISOString(),
      });
    }

    const apiKey = sanitizeApiKey(process.env.GEMINI_API_KEY);
    
    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'GEMINI_API_KEY not configured',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Fetch available models directly from the API
    const modelsResponse = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
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
      const testResponse = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "Hello" in one word.' }] }],
          }),
        }
      );
      
      if (testResponse.ok) {
        const testData = await testResponse.json();
        testResult = {
          model: modelName,
          status: 'success',
          response: testData.candidates?.[0]?.content?.parts?.[0]?.text || 'No response',
        };
      }
    }
    
    return NextResponse.json({
      status: testResult ? 'success' : 'degraded',
      apiKeyConfigured: true,
      availableModels,
      workingModel: workingModel?.name || null,
      testResult,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    const message =
      error?.name === 'AbortError'
        ? 'Timed out while reaching Gemini API'
        : error?.message || 'Unknown error';

    return NextResponse.json({
      status: 'error',
      message,
      errorName: error?.name || 'Error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
