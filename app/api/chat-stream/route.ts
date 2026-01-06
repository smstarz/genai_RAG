import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import { getSystemPrompt } from '@/lib/prompts';
import { getSettings } from '@/lib/settings';

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        // 설정 가져오기
        const settings = await getSettings();
        const systemPrompt = await getSystemPrompt();

        const result = streamText({
            model: google(settings.model),
            system: systemPrompt,
            messages,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(
            JSON.stringify({ error: 'Failed to generate response' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
