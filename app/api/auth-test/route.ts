import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const googleProvider = authOptions.providers?.find(
    (provider: any) => provider.id === 'google'
  );

  return NextResponse.json({
    googleProviderConfigured: !!googleProvider,
    authOptionsDebug: !!authOptions.debug,
    hasSignInPage: !!authOptions.pages?.signIn,
    sessionStrategy: authOptions.session?.strategy,
    providers: authOptions.providers?.map((p: any) => ({ id: p.id, name: p.name })),
  });
}