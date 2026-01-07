import { getSettings, DEFAULT_SETTINGS } from './settings';

// 기본 시스템 프롬프트 (RAG용)
export const DEFAULT_SYSTEM_PROMPT = `당신은 업로드된 문서를 기반으로 답변하는 전문 AI 어시스턴트입니다.

## 핵심 지침
- 모든 질문에 대해 반드시 업로드된 문서를 먼저 검색하세요.
- 문서에서 관련 정보를 찾아 정확하게 답변하세요.
- 문서에 해당 정보가 없으면 "문서에서 해당 정보를 찾을 수 없습니다"라고 명확히 말하세요.

## 답변 스타일
- 명확하고 구조화된 답변을 제공합니다.
- 필요한 경우 목록이나 단계별 설명을 사용합니다.
- 한국어로 친근하게 대화합니다.
- 문서에서 찾은 정보는 출처를 명확히 언급합니다.

## 주의사항
- 확실하지 않은 정보는 추측하지 않습니다.
- 문서에 없는 내용을 지어내지 않습니다.`;

// 시스템 프롬프트 가져오기 (KV에서 조회)
export async function getSystemPrompt(): Promise<string> {
    try {
        const settings = await getSettings();
        return settings.systemPrompt || DEFAULT_SETTINGS.systemPrompt;
    } catch {
        return DEFAULT_SETTINGS.systemPrompt;
    }
}
