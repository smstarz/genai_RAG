import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';
import { getSystemPrompt } from '@/lib/prompts';
import { getSettings } from '@/lib/settings';

interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export async function POST(req: Request) {
    try {
        const { message, storeId, history } = await req.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // 설정 가져오기
        const settings = await getSettings();
        // 시스템 프롬프트 가져오기
        const systemInstruction = await getSystemPrompt();

        // 대화 기록을 Gemini 형식으로 변환
        const contents: ChatMessage[] = [];

        // 이전 대화 기록 추가
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                contents.push({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                });
            }
        }

        // 현재 사용자 메시지 추가
        contents.push({
            role: 'user',
            parts: [{ text: message }],
        });

        // File Search Tool 설정 (storeId가 유효할 경우에만)
        // 공백 문자열이나 빈 문자열은 제외
        const validStoreId = storeId && storeId.trim() !== '';

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tools: any[] | undefined = validStoreId
            ? [
                {
                    fileSearch: {
                        fileSearchStoreNames: [storeId],
                    },
                },
            ]
            : undefined;

        // 디버그 로그
        console.log('[Chat API] Model:', settings.model);
        console.log('[Chat API] StoreId:', storeId, '-> Valid:', validStoreId);
        console.log('[Chat API] History length:', contents.length - 1);
        if (validStoreId) {
            console.log('[Chat API] Using File Search with store:', storeId);
        }

        // 항상 배열 형식 contents 사용 (멀티턴 대화 + RAG 모두 지원)
        const response = await ai.models.generateContent({
            model: settings.model,
            contents: contents,  // 배열 형식: 히스토리 + 현재 질문
            config: {
                systemInstruction: systemInstruction,
                ...(tools && { tools }),
            },
        });

        // 인용 정보 추출
        const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // 디버그: grounding metadata 로깅
        if (validStoreId) {
            const groundingMeta = response.candidates?.[0]?.groundingMetadata;
            console.log('[Chat API] Grounding Metadata:', groundingMeta ? 'present' : 'absent');
        }

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
