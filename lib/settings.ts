import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

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

// 설정 파일 읽기
export async function getSettings(): Promise<Settings> {
    try {
        const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return DEFAULT_SETTINGS;
    }
}

// 설정 파일 쓰기
export async function saveSettings(settings: Partial<Settings>): Promise<void> {
    const current = await getSettings();
    const newSettings = { ...current, ...settings };

    const dir = path.dirname(SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(newSettings, null, 2), 'utf-8');
}
