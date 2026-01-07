import { GoogleGenAI } from '@google/genai';
import { getSettings, DEFAULT_MODEL } from '@/lib/settings';

// Gemini API 클라이언트 인스턴스
export const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '' });

export { DEFAULT_MODEL };

// API 연결 상태 확인
export async function checkApiConnection(): Promise<boolean> {
    try {
        const settings = await getSettings();
        const response = await ai.models.generateContent({
            model: settings.model,
            contents: 'ping',
        });
        return !!response;
    } catch {
        return false;
    }
}
