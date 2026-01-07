# 🤖 GenAI RAG Chatbot

**Gemini File Search 기반 RAG 채팅 애플리케이션**

Next.js와 Google Gemini API를 활용한 서버리스 RAG(Retrieval-Augmented Generation) 채팅봇입니다. 문서를 업로드하고, AI가 해당 문서를 기반으로 정확한 답변을 제공합니다.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)
![Gemini](https://img.shields.io/badge/Gemini-API-4285F4?style=flat-square&logo=google)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?style=flat-square&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000?style=flat-square&logo=vercel)

---

## ✨ 주요 기능

### 💬 채팅 페이지 (`/chat`)
- **실시간 스트리밍 응답** - 답변이 타이핑되듯 실시간 렌더링
- **RAG 모드** - 업로드된 문서 기반 정확한 답변 제공
- **일반 채팅 모드** - 문서 없이 일반 대화 가능
- **다크 모드 지원** - 눈에 편한 다크/라이트 모드
- **채팅 히스토리** - Vercel KV 기반 대화 내역 저장

### ⚙️ 관리자 페이지 (`/admin`)
- **스토어 관리** - File Search Store 생성/삭제
- **파일 관리** - PDF, DOCX, TXT 등 다양한 문서 업로드/삭제
- **모델 선택** - Gemini 모델 동적 변경
- **시스템 프롬프트 설정** - AI 행동 커스터마이징

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 |
| **AI/LLM** | Google Gemini API |
| **RAG** | Gemini File Search |
| **Database** | Vercel KV |
| **Deployment** | Vercel |
| **UI Components** | Radix UI, Framer Motion |

---

## 🚀 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/smstarz/genai_RAG.git
cd genai_RAG
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Gemini API (필수)
GEMINI_API_KEY=your_gemini_api_key

# Vercel KV (선택 - 채팅 히스토리 저장용)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token

# Admin Password (선택)
ADMIN_PASSWORD=your_admin_password
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

---

## 📁 프로젝트 구조

```
genai_RAG/
├── app/
│   ├── api/
│   │   ├── chat/           # 일반 채팅 API
│   │   ├── chat-stream/    # 스트리밍 채팅 API
│   │   ├── files/          # 파일 관리 API
│   │   └── stores/         # 스토어 관리 API
│   ├── chat/               # 채팅 페이지
│   └── admin/              # 관리자 페이지
├── components/             # UI 컴포넌트
├── lib/                    # 유틸리티 함수
└── public/                 # 정적 파일
```

---

## 📄 지원 파일 형식

| 카테고리 | 형식 |
|----------|------|
| **문서** | PDF, DOCX, PPTX, XLSX, TXT |
| **코드** | JS, PY, JAVA, C, CPP, GO, TS 등 |
| **마크업** | HTML, CSS, MD, JSON, XML |

---

## 🌐 배포

### Vercel 배포 (권장)

1. [Vercel](https://vercel.com)에 GitHub 저장소 연결
2. Environment Variables 설정
3. 자동 빌드 & 배포 완료

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/smstarz/genai_RAG)

---

## 📝 사용 방법

### 1. 스토어 생성
관리자 페이지(`/admin`)에서 새로운 File Search Store를 생성합니다.

### 2. 문서 업로드
생성한 스토어에 RAG에 사용할 문서들을 업로드합니다.

### 3. RAG 채팅
채팅 페이지(`/chat`)에서 스토어를 선택하고 문서 기반 질문을 시작합니다.

---

## 🔒 보안

- API Key는 서버 사이드에서만 사용 (클라이언트 노출 없음)
- 관리자 페이지 비밀번호 보호
- 환경 변수를 통한 민감 정보 관리

---

## 📜 라이선스

ISC License

---

## 🙏 Acknowledgments

- [Google Gemini API](https://ai.google.dev/)
- [Next.js](https://nextjs.org/)
- [Vercel](https://vercel.com/)
- [Tailwind CSS](https://tailwindcss.com/)
