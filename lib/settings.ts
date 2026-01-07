import { createClient, VercelKV } from '@vercel/kv';

const SETTINGS_KEY = 'app:settings';

export const DEFAULT_MODEL = 'gemini-3-flash-preview';

// 기본 설정
export const DEFAULT_SETTINGS = {
    systemPrompt: `당신은 친절하고 전문적인 AI 어시스턴트입니다.

## 역할
- 사용자의 질문에 정확하고 도움이 되는 답변을 제공합니다.
- 문서 기반 검색(RAG)이 활성화된 경우, 제공된 문서를 참조하여 답변합니다.

## 답변 스타일
- 명확하고 구조화된 답변을 제공합니다.
- 필요한 경우 목록이나 단계별 설명을 사용합니다.
- 한국어로 친근하게 반말로 대화합니다.

## 주의사항
- 확실하지 않은 정보는 추측하지 않고 모른다고 말합니다.
- 문서에서 찾은 정보는 출처를 명확히 합니다.`,
    model: DEFAULT_MODEL,
};

export interface Settings {
    systemPrompt: string;
    model: string;
}

// KV 클라이언트 (환경변수가 있을 때만 생성)
let kv: VercelKV | null = null;

function getKV(): VercelKV | null {
    if (kv) return kv;
    
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        kv = createClient({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
    }
    return kv;
}

// 설정 조회
export async function getSettings(): Promise<Settings> {
    const kvClient = getKV();
    
    if (!kvClient) {
        console.log('[Settings] KV not configured, using defaults');
        return DEFAULT_SETTINGS;
    }

    try {
        const data = await kvClient.get<Settings>(SETTINGS_KEY);
        if (data) {
            return { ...DEFAULT_SETTINGS, ...data };
        }
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('[Settings] Failed to read from KV:', error);
        return DEFAULT_SETTINGS;
    }
}

// 설정 저장
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
    const kvClient = getKV();
    
    if (!kvClient) {
        throw new Error('KV not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN environment variables.');
    }

    try {
        const current = await getSettings();
        const newSettings = { ...current, ...settings };
        await kvClient.set(SETTINGS_KEY, newSettings);
    } catch (error) {
        console.error('[Settings] Failed to save to KV:', error);
        throw error;
    }
}
