import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getSystemPrompt } from '@/lib/prompts';
import { getSettings } from '@/lib/settings';

// Gemini API 클라이언트
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });


export async function POST(req: Request) {
    try {
        const { message, storeId, history } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 설정 가져오기
        const settings = await getSettings();
        const systemInstruction = await getSystemPrompt();

        // File Search 사용 여부 확인
        const validStoreId = storeId && storeId.trim() !== '';

        // 대화 기록을 Gemini 형식으로 변환
        const historyContents = (history && Array.isArray(history))
            ? history.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            }))
            : [];

        // 최종 contents 배열
        const contents = [
            ...historyContents,
            { role: 'user', parts: [{ text: message }] }
        ];

        // 디버그 로그
        console.log('[Chat API] ============ REQUEST ============');
        console.log('[Chat API] Model:', settings.model);
        console.log('[Chat API] StoreId:', storeId, '-> Valid:', validStoreId);
        console.log('[Chat API] SystemInstruction length:', systemInstruction.length);

        // File Search API 호출
        const response = await ai.models.generateContent({
            model: settings.model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
                ...(validStoreId && {
                    tools: [
                        {
                            fileSearch: {
                                fileSearchStoreNames: [storeId],
                            },
                        },
                    ],
                }),
            },
        });

        // 디버그: 전체 응답 로깅
        console.log('[Chat API] ============ RESPONSE ============');
        console.log('[Chat API] Response text:', response.text?.substring(0, 100));
        console.log('[Chat API] Finish reason:', response.candidates?.[0]?.finishReason);

        // 인용 정보 추출
        const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const groundingMeta = response.candidates?.[0]?.groundingMetadata;

        console.log('[Chat API] Grounding Metadata:', groundingMeta ? JSON.stringify(groundingMeta, null, 2) : 'absent');
        console.log('[Chat API] Citations count:', citations.length);

        return NextResponse.json({
            text: response.text || '',
            citations: citations,
        });
    } catch (error: any) {
        // 상세 에러 로깅
        console.error('[Chat API] Error:', error.message);
        console.error('[Chat API] Error Status:', error.status);
        if (error.stack) {
            console.error('[Chat API] Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
        }
        return NextResponse.json(
            { error: 'Failed to generate response', details: error.message },
            { status: 500 }
        );
    }
}
