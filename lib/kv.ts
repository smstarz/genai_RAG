import { createClient, VercelKV } from '@vercel/kv';

// Message 인터페이스 정의
interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: unknown[];
}

// 환경변수가 있을 때만 KV 클라이언트 생성
let kv: VercelKV | null = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    kv = createClient({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
    });
}

/**
 * KV 연결 상태 확인
 */
export function isKVConfigured(): boolean {
    return kv !== null;
}

/**
 * 채팅 저장 (KV 없으면 무시)
 */
export async function saveChat(sessionId: string, messages: ChatMessage[]): Promise<boolean> {
    if (!kv) {
        console.log('[KV] Not configured, skipping save');
        return false;
    }

    try {
        await kv.set(`chat:${sessionId}`, JSON.stringify(messages));
        // 7일 후 자동 만료 설정
        await kv.expire(`chat:${sessionId}`, 60 * 60 * 24 * 7);
        return true;
    } catch (error) {
        console.error('[KV] Save error:', error);
        return false;
    }
}

/**
 * 채팅 조회 (KV 없으면 null 반환)
 */
export async function getChat(sessionId: string): Promise<ChatMessage[] | null> {
    if (!kv) {
        console.log('[KV] Not configured, returning null');
        return null;
    }

    try {
        const data = await kv.get<string>(`chat:${sessionId}`);
        if (data) {
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
        return null;
    } catch (error) {
        console.error('[KV] Get error:', error);
        return null;
    }
}

/**
 * 채팅 삭제
 */
export async function deleteChat(sessionId: string): Promise<boolean> {
    if (!kv) {
        return false;
    }

    try {
        await kv.del(`chat:${sessionId}`);
        return true;
    } catch (error) {
        console.error('[KV] Delete error:', error);
        return false;
    }
}
