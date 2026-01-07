import { NextResponse } from 'next/server';
import { checkApiConnection } from '@/lib/gemini';

export async function GET() {
    try {
        const isConnected = await checkApiConnection();
        return NextResponse.json({
            connected: isConnected,
            apiKeyConfigured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
        });
    } catch {
        return NextResponse.json({
            connected: false,
            apiKeyConfigured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
        });
    }
}
