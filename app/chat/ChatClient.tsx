'use client';

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Settings, Trash2 } from 'lucide-react';
import {
    PortfolioSidePanel,
    PortfolioFloatingButton,
    PortfolioModal,
} from '@/components/PortfolioViewer';

const ReactMarkdown = dynamic(
    () => import('react-markdown').then((mod) => mod.default),
    { ssr: false, loading: () => <span>...</span> }
);

// remark-gfm for better Korean text handling with markdown
import remarkGfm from 'remark-gfm';

interface Citation {
    retrievedContext?: {
        uri?: string;
        title?: string;
    };
    web?: {
        uri?: string;
        title?: string;
    };
}

interface Store {
    name: string;
    displayName?: string;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
}

interface ChatClientProps {
    portfolioImages: string[];
}

export default function ChatClient({ portfolioImages }: ChatClientProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // RAG 모드 여부 (공백 문자열도 빈 값으로 처리)
    const isRagMode = selectedStore.trim() !== '';

    // 세션 ID 초기화 및 채팅 히스토리 로드
    useEffect(() => {
        // 세션 ID 가져오기 또는 생성
        let sid = localStorage.getItem('chat_session_id');
        if (!sid) {
            sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('chat_session_id', sid);
        }
        setSessionId(sid);

        // 저장된 채팅 히스토리 로드
        const loadChatHistory = async () => {
            try {
                const res = await fetch(`/api/chat-history?sessionId=${sid}`);
                const data = await res.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error('Failed to load chat history:', error);
            }
        };

        loadChatHistory();
    }, []);

    // 메시지 변경 시 KV에 저장
    useEffect(() => {
        if (!sessionId || messages.length === 0) return;

        const saveChatHistory = async () => {
            try {
                await fetch('/api/chat-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId, messages }),
                });
            } catch (error) {
                console.error('Failed to save chat history:', error);
            }
        };

        // 디바운스: 마지막 메시지 변경 후 500ms 뒤에 저장
        const timeoutId = setTimeout(saveChatHistory, 500);
        return () => clearTimeout(timeoutId);
    }, [sessionId, messages]);

    // 스토어 목록 조회
    const fetchStores = useCallback(async () => {
        try {
            const res = await fetch('/api/stores');
            const data = await res.json();
            setStores(data.stores || []);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        }
    }, []);

    useEffect(() => {
        fetchStores();
    }, [fetchStores]);

    // 스크롤 to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 로딩 완료 후 입력창에 포커스 유지
    useEffect(() => {
        if (!isLoading) {
            inputRef.current?.focus();
        }
    }, [isLoading]);

    // 스트리밍 메시지 전송 (일반 채팅)
    const handleStreamSubmit = async (userContent: string) => {
        const assistantId = (Date.now() + 1).toString();

        // 빈 어시스턴트 메시지 추가
        setMessages((prev) => [
            ...prev,
            { id: assistantId, role: 'assistant', content: '' },
        ]);

        try {
            const res = await fetch('/api/chat-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        ...messages.map((m) => ({
                            role: m.role,
                            content: m.content,
                        })),
                        { role: 'user', content: userContent },
                    ],
                }),
            });

            if (!res.ok) throw new Error('Stream request failed');

            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let content = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    content += chunk;

                    // 실시간으로 메시지 업데이트
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantId ? { ...m, content } : m
                        )
                    );
                }
            }
        } catch (error) {
            console.error('Stream error:', error);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantId
                        ? { ...m, content: '오류가 발생했습니다. 다시 시도해주세요.' }
                        : m
                )
            );
        }
    };

    // RAG 메시지 전송
    const handleRagSubmit = async (userContent: string) => {
        try {
            const history = messages.map((msg) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                content: msg.content,
            }));

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userContent,
                    storeId: selectedStore,
                    history,
                }),
            });

            const data = await res.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.text || '응답을 생성하지 못했습니다.',
                citations: data.citations,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: '오류가 발생했습니다. 다시 시도해주세요.',
                },
            ]);
        }
    };

    // 메시지 제출
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const userContent = input.trim();
        setInput('');
        setIsLoading(true);

        if (isRagMode) {
            await handleRagSubmit(userContent);
        } else {
            await handleStreamSubmit(userContent);
        }

        setIsLoading(false);
    };

    // 관리자 로그인
    const handleAdminLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (!password.trim() || isLoggingIn) return;

        setIsLoggingIn(true);
        setLoginError('');

        try {
            const res = await fetch('/api/auth/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            const data = await res.json();

            if (data.success) {
                window.location.href = '/admin';
            } else {
                setLoginError(data.message || '비밀번호가 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoginError('로그인 오류가 발생했습니다.');
        }

        setIsLoggingIn(false);
    };

    const closeLoginModal = () => {
        setShowLoginModal(false);
        setPassword('');
        setLoginError('');
    };

    // 새 채팅 시작 (기록 초기화)
    const handleNewChat = async () => {
        // 새 세션 ID 생성
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('chat_session_id', newSessionId);
        setSessionId(newSessionId);
        setMessages([]);
    };

    return (
        <div className="h-[100dvh] flex overflow-hidden">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="shrink-0 z-50 glass border-b border-[var(--ivory-400)]">
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
                        {/* Mobile: 2 rows, Desktop: 1 row */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                            {/* Row 1: Title + Badge */}
                            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
                                <h1 className="text-base sm:text-xl font-semibold text-[var(--ivory-900)] truncate">💬 RAG Chat</h1>
                                {isRagMode ? (
                                    <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-700 rounded-full">
                                        RAG
                                    </span>
                                ) : (
                                    <span className="shrink-0 px-2 py-0.5 text-xs font-medium bg-primary-500/20 text-primary-700 rounded-full">
                                        스트리밍
                                    </span>
                                )}
                                {/* Mobile only: action buttons */}
                                <div className="flex sm:hidden items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={handleNewChat}
                                        title="새 채팅"
                                        disabled={messages.length === 0}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() => setShowLoginModal(true)}
                                        title="관리자 설정"
                                    >
                                        <Settings className="size-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Row 2: Store Selector + Desktop Action Buttons */}
                            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
                                {/* Store Selector */}
                                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                                    <span className="text-[var(--ivory-700)] text-sm hidden sm:block">스토어:</span>
                                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                                        <SelectTrigger className="w-full sm:w-[160px]">
                                            <SelectValue placeholder="선택 안함" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value=" ">선택 안함</SelectItem>
                                            {stores.map((store) => (
                                                <SelectItem key={store.name} value={store.name}>
                                                    {store.displayName || store.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Desktop only: action buttons */}
                                <div className="hidden sm:flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleNewChat}
                                        title="새 채팅"
                                        disabled={messages.length === 0}
                                    >
                                        <Trash2 className="size-5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setShowLoginModal(true)}
                                        title="관리자 설정"
                                    >
                                        <Settings className="size-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <main className="flex-1 overflow-y-auto min-h-0">
                    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
                        {messages.length === 0 ? (
                            <div className="text-center py-8 sm:py-20">
                                <img
                                    src="/images/chat-logo.png"
                                    alt="Chat Logo"
                                    className="w-48 h-48 sm:w-72 sm:h-72 md:w-96 md:h-96 mx-auto mb-4 object-contain"
                                />
                                <h2 className="text-xl sm:text-2xl font-semibold text-[var(--ivory-900)] mb-2">
                                    SMstarz's RAG Chat
                                </h2>
                                <p className="text-sm sm:text-base text-[var(--ivory-700)] max-w-md mx-auto px-4">
                                    {isRagMode
                                        ? '문서 기반으로 정확한 답변을 받아보세요.'
                                        : '이경훈님의 챗봇입니다.'}
                                </p>
                                {!isRagMode && (
                                    <p className="text-[var(--ivory-600)] text-xs sm:text-sm mt-2 px-4">
                                        ✨ 스토어를 선택하면 해당 프로젝트에 대한 답변을 받을 수 있습니다.
                                    </p>
                                )}
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3 text-[13px] shadow-sm ${message.role === 'user'
                                            ? 'bg-primary-600 text-white rounded-br-md'
                                            : 'glass text-[var(--ivory-800)] rounded-bl-md'
                                            }`}
                                    >
                                        {/* Avatar */}
                                        <div className="flex items-start gap-3">
                                            {message.role !== 'user' && (
                                                <div className="shrink-0 w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center">
                                                    <img
                                                        src="/images/agent.ico"
                                                        alt="Agent"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                {message.role === 'assistant' ? (
                                                    <div className="markdown-content">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-wrap break-words">
                                                        {message.content}
                                                    </p>
                                                )}

                                                {/* Citations (RAG mode only) */}
                                                {message.citations && message.citations.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-[var(--ivory-400)]">
                                                        <p className="text-xs text-[var(--ivory-600)] mb-2">📚 출처:</p>
                                                        <div className="space-y-1">
                                                            {(() => {
                                                                // 제목을 기준으로 중복 제거
                                                                const uniqueCitations = message.citations.filter((cite, index, self) =>
                                                                    index === self.findIndex((c) => (
                                                                        (c.retrievedContext?.title || c.web?.title) === (cite.retrievedContext?.title || cite.web?.title)
                                                                    ))
                                                                );

                                                                return uniqueCitations.map((cite, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="text-xs text-[var(--ivory-700)] bg-[var(--ivory-300)] px-2 py-1 rounded"
                                                                    >
                                                                        {cite.retrievedContext?.title ||
                                                                            cite.web?.title ||
                                                                            `문서 ${idx + 1}`}
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading indicator */}
                        {isLoading && messages[messages.length - 1]?.role === 'user' && (
                            <div className="flex justify-start">
                                <div className="glass rounded-2xl rounded-bl-md px-5 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-[30px] h-[30px] rounded-full overflow-hidden shrink-0">
                                            <img
                                                src="/images/agent.ico"
                                                alt="Agent"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex gap-1">
                                            <span
                                                className="size-2 bg-primary-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '0ms' }}
                                            />
                                            <span
                                                className="size-2 bg-primary-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '150ms' }}
                                            />
                                            <span
                                                className="size-2 bg-primary-400 rounded-full animate-bounce"
                                                style={{ animationDelay: '300ms' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </main>

                {/* Input */}
                <footer className="shrink-0 glass border-t border-[var(--ivory-400)] pb-[env(safe-area-inset-bottom)]">
                    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                        <div className="flex gap-2 sm:gap-3">
                            <Input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="메시지를 입력하세요..."
                                disabled={isLoading}
                                autoFocus
                                className="text-base"
                            />
                            <ShimmerButton type="submit" disabled={isLoading || !input.trim()} className="shrink-0 px-4 sm:px-6">
                                {isLoading ? '...' : '전송'}
                            </ShimmerButton>
                        </div>
                    </form>
                </footer>

                {/* Admin Login Modal */}
                <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>🔐 관리자 로그인</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div>
                                <label className="block text-[var(--ivory-700)] text-sm mb-2">비밀번호</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="관리자 비밀번호 입력"
                                    autoFocus
                                />
                            </div>
                            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={closeLoginModal}
                                >
                                    취소
                                </Button>
                                <ShimmerButton
                                    type="submit"
                                    disabled={isLoggingIn || !password.trim()}
                                    className="flex-1"
                                >
                                    {isLoggingIn ? '로그인 중...' : '로그인'}
                                </ShimmerButton>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

            </div>
            {/* End of Main Chat Area */}

            {/* PC: Portfolio Side Panel */}
            <PortfolioSidePanel
                isOpen={isPortfolioOpen}
                onToggle={() => setIsPortfolioOpen(!isPortfolioOpen)}
                images={portfolioImages}
            />

            {/* Mobile: Floating Button + Modal */}
            <PortfolioFloatingButton onClick={() => setIsPortfolioOpen(true)} />
            <PortfolioModal
                isOpen={isPortfolioOpen}
                onClose={() => setIsPortfolioOpen(false)}
                images={portfolioImages}
            />
        </div>
    );
}
