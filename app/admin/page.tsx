'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface FileSearchStore {
    name: string;
    displayName?: string;
    createTime?: string;
}

interface Document {
    name: string;
    displayName?: string;
    createTime?: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [stores, setStores] = useState<FileSearchStore[]>([]);
    const [files, setFiles] = useState<Document[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [newStoreName, setNewStoreName] = useState('');
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [loading, setLoading] = useState({ stores: false, files: false, upload: false, settings: false });
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [settings, setSettings] = useState<{ systemPrompt: string; model: string }>({
        systemPrompt: '',
        model: 'gemini-3-flash-preview', // Default fallback
    });
    const [settingsSaved, setSettingsSaved] = useState(false);

    const MODEL_OPTIONS = [
        { value: 'gemini-3-pro-preview', label: 'Gemini 3.0 Pro Preview' },
        { value: 'gemini-3-flash-preview', label: 'Gemini 3.0 Flash Preview' },
        { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    ];

    // 인증 상태 확인
    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/admin');
            const data = await res.json();
            if (data.authenticated) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
                router.push('/admin/login');
            }
        } catch {
            setIsAuthenticated(false);
            router.push('/chat');
        }
    }, [router]);

    // 로그아웃
    const handleLogout = async () => {
        try {
            await fetch('/api/auth/admin', { method: 'DELETE' });
            router.push('/chat');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // API 연결 상태 확인
    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            setIsConnected(data.connected);
        } catch {
            setIsConnected(false);
        }
    }, []);

    // 스토어 목록 조회
    const fetchStores = useCallback(async () => {
        setLoading(prev => ({ ...prev, stores: true }));
        try {
            const res = await fetch('/api/stores');
            const data = await res.json();
            setStores(data.stores || []);
        } catch (error) {
            console.error('Failed to fetch stores:', error);
        }
        setLoading(prev => ({ ...prev, stores: false }));
    }, []);

    // 파일 목록 조회
    const fetchFiles = useCallback(async (storeId: string) => {
        if (!storeId) return;
        setLoading(prev => ({ ...prev, files: true }));
        try {
            const res = await fetch(`/api/files?storeId=${encodeURIComponent(storeId)}`);
            const data = await res.json();
            setFiles(data.files || []);
        } catch (error) {
            console.error('Failed to fetch files:', error);
        }
        setLoading(prev => ({ ...prev, files: false }));
    }, []);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    // 설정 조회 (시스템 프롬프트 & 모델)
    const fetchSettings = useCallback(async () => {
        try {
            const res = await fetch('/api/settings');
            const data = await res.json();
            setSettings({
                systemPrompt: data.systemPrompt || '',
                model: data.model || 'gemini-3-flash-preview',
            });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        }
    }, []);

    // 설정 저장
    const saveSettings = async () => {
        setLoading(prev => ({ ...prev, settings: true }));
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 2000);
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
        setLoading(prev => ({ ...prev, settings: false }));
    };

    useEffect(() => {
        if (isAuthenticated) {
            checkStatus();
            fetchStores();
            fetchSettings();
        }
    }, [isAuthenticated, checkStatus, fetchStores, fetchSettings]);

    useEffect(() => {
        if (selectedStore) {
            fetchFiles(selectedStore);
        } else {
            setFiles([]);
        }
    }, [selectedStore, fetchFiles]);

    // 스토어 생성
    const createStore = async () => {
        if (!newStoreName.trim()) return;
        setLoading(prev => ({ ...prev, stores: true }));
        try {
            const res = await fetch('/api/stores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayName: newStoreName }),
            });
            if (res.ok) {
                setNewStoreName('');
                fetchStores();
            }
        } catch (error) {
            console.error('Failed to create store:', error);
        }
        setLoading(prev => ({ ...prev, stores: false }));
    };

    // 스토어 삭제
    const deleteStore = async (storeId: string) => {
        const id = storeId.replace('fileSearchStores/', '');
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/stores/${id}`, { method: 'DELETE' });
            if (selectedStore === storeId) setSelectedStore('');
            fetchStores();
        } catch (error) {
            console.error('Failed to delete store:', error);
        }
    };

    // 파일 업로드
    const handleUpload = async () => {
        if (!uploadFile || !selectedStore) return;
        setLoading(prev => ({ ...prev, upload: true }));
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('storeId', selectedStore);

            const res = await fetch('/api/files', {
                method: 'POST',
                body: formData,
            });
            if (res.ok) {
                setUploadFile(null);
                fetchFiles(selectedStore);
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
        }
        setLoading(prev => ({ ...prev, upload: false }));
    };

    // 파일 삭제
    const deleteFile = async (docId: string) => {
        if (!confirm('파일을 삭제하시겠습니까?')) return;
        try {
            await fetch(`/api/files/${encodeURIComponent(docId)}?storeId=${encodeURIComponent(selectedStore)}`, {
                method: 'DELETE',
            });
            fetchFiles(selectedStore);
        } catch (error) {
            console.error('Failed to delete file:', error);
        }
    };

    // 인증 확인 중
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-slate-400">인증 확인 중...</p>
                </div>
            </div>
        );
    }

    // 미인증 시 아무것도 렌더링하지 않음 (리다이렉트 처리됨)
    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="min-h-screen p-6 md:p-8">
            {/* Header */}
            <header className="max-w-6xl mx-auto mb-8">
                <div className="relative flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">⚙️ 관리자 페이지</h1>
                        <p className="text-slate-400">File Search Store 및 문서 관리</p>
                    </div>

                    {/* API Status Badge - Centered */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full backdrop-blur-sm shadow-sm">
                            <div className={`w-2.5 h-2.5 rounded-full ${isConnected === null ? 'bg-yellow-500 animate-pulse' :
                                isConnected ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                            <span className="text-slate-300 text-sm font-medium">
                                {isConnected === null ? '연결 확인 중...' :
                                    isConnected ? 'Gemini API 연결됨' : 'API 연결 실패'}
                            </span>
                            <button
                                onClick={checkStatus}
                                className="ml-1 p-1 text-slate-400 hover:text-white transition-colors"
                                title="상태 새로고침"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/chat')}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-smooth"
                        >
                            ← 채팅으로
                        </button>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-smooth"
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column - Settings (Model & System Prompt) */}
                    <div className="lg:w-1/2 lg:sticky lg:top-6 lg:self-start">
                        <section className="glass rounded-2xl p-6 h-full">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-slate-700">🧠 AI 모델 및 프롬프트 설정</h2>
                                <div className="flex items-center gap-3">
                                    {settingsSaved && (
                                        <span className="text-green-400 text-sm">✓ 저장됨</span>
                                    )}
                                    <button
                                        onClick={saveSettings}
                                        disabled={loading.settings}
                                        className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                                    >
                                        {loading.settings ? '저장 중...' : '💾 저장'}
                                    </button>
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div className="mb-6">
                                <label className="block text-slate-400 text-sm mb-2">사용 모델</label>
                                <div className="relative">
                                    <select
                                        value={settings.model}
                                        onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                    >
                                        {MODEL_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="block text-slate-400 text-sm mb-2">시스템 프롬프트</label>
                                <textarea
                                    value={settings.systemPrompt}
                                    onChange={(e) => setSettings(prev => ({ ...prev, systemPrompt: e.target.value }))}
                                    placeholder="시스템 프롬프트를 입력하세요..."
                                    rows={25}
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y font-mono text-sm"
                                />
                            </div>
                            <p className="text-slate-500 text-xs">AI 어시스턴트의 기본 동작을 설정합니다. 모든 채팅 모드에 공통으로 적용됩니다.</p>
                        </section>
                    </div>

                    {/* Right Column - API Status, Store & File Management */}
                    <div className="lg:w-1/2 space-y-6">
                        {/* API Status */}


                        {/* Store Management */}
                        <section className="glass rounded-2xl p-6">
                            <h2 className="text-xl font-semibold text-slate-700 mb-4">📁 스토어 관리</h2>

                            {/* Create Store */}
                            <div className="flex gap-3 mb-6">
                                <input
                                    type="text"
                                    placeholder="새 스토어 이름"
                                    value={newStoreName}
                                    onChange={(e) => setNewStoreName(e.target.value)}
                                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button
                                    onClick={createStore}
                                    disabled={loading.stores || !newStoreName.trim()}
                                    className="px-6 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                                >
                                    {loading.stores ? '생성 중...' : '+ 생성'}
                                </button>
                            </div>

                            {/* Store List */}
                            <div className="space-y-2">
                                {stores.length === 0 ? (
                                    <p className="text-slate-500 text-center py-4">
                                        {loading.stores ? '로딩 중...' : '스토어가 없습니다. 새 스토어를 생성해주세요.'}
                                    </p>
                                ) : (
                                    stores.map((store) => (
                                        <div
                                            key={store.name}
                                            className={`flex items-center justify-between p-4 rounded-xl transition-smooth cursor-pointer ${selectedStore === store.name
                                                ? 'bg-primary-600/30 border border-primary-500'
                                                : 'bg-slate-800/50 hover:bg-slate-700/50'
                                                }`}
                                            onClick={() => setSelectedStore(store.name)}
                                        >
                                            <div>
                                                <p className="text-white font-medium text-sm">{store.displayName || store.name}</p>
                                                <p className="text-slate-500 text-xs">{store.name}</p>
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteStore(store.name); }}
                                                className="px-3 py-1 text-red-400 text-sm hover:bg-red-500/20 rounded-lg transition-smooth"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* File Management */}
                        {selectedStore && (
                            <section className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-semibold text-slate-700 mb-4">📄 파일 관리</h2>
                                <p className="text-slate-400 text-sm mb-4">선택된 스토어: {selectedStore}</p>

                                {/* File Upload */}
                                <div className="flex gap-3 mb-6">
                                    <input
                                        type="file"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white file:mr-4 file:py-1 file:px-4 file:rounded-lg file:border-0 file:bg-primary-600 file:text-white file:cursor-pointer"
                                    />
                                    <button
                                        onClick={handleUpload}
                                        disabled={loading.upload || !uploadFile}
                                        className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                                    >
                                        {loading.upload ? '업로드 중...' : '⬆️ 업로드'}
                                    </button>
                                </div>

                                {/* File List */}
                                <div className="space-y-2">
                                    {files.length === 0 ? (
                                        <p className="text-slate-500 text-center py-4">
                                            {loading.files ? '로딩 중...' : '업로드된 파일이 없습니다.'}
                                        </p>
                                    ) : (
                                        files.map((file) => (
                                            <div
                                                key={file.name}
                                                className="flex items-center justify-between gap-3 p-4 bg-slate-800/50 rounded-xl"
                                            >
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white text-sm truncate">{file.displayName || file.name}</p>
                                                    <p className="text-slate-500 text-xs truncate">{file.name}</p>
                                                </div>
                                                <button
                                                    onClick={() => deleteFile(file.name)}
                                                    className="flex-shrink-0 px-3 py-1 text-red-400 text-sm hover:bg-red-500/20 rounded-lg transition-smooth"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
