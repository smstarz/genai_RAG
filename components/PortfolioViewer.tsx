'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, FileImage, GripVertical, Briefcase, Download } from 'lucide-react';

// 스크롤 위치 저장 키
const SCROLL_POSITION_KEY = 'portfolio_scroll_position';

interface PortfolioViewerProps {
    images: string[];
    onClose?: () => void;
    showCloseButton?: boolean;
}

// 이미지 Lightbox (전체화면 뷰어)
function ImageLightbox({
    src,
    alt,
    onClose,
}: {
    src: string;
    alt: string;
    onClose: () => void;
}) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const lastTouchDistance = useRef<number | null>(null);
    const lastTouchCenter = useRef<{ x: number; y: number } | null>(null);
    const isDragging = useRef(false);
    const lastPosition = useRef({ x: 0, y: 0 });

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // 터치 핀치 줌
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastTouchDistance.current = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            lastTouchCenter.current = {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2,
            };
        } else if (e.touches.length === 1 && scale > 1) {
            isDragging.current = true;
            lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, [scale]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
            const scaleChange = distance / lastTouchDistance.current;
            const newScale = Math.min(Math.max(scale * scaleChange, 1), 4);
            setScale(newScale);
            lastTouchDistance.current = distance;

            if (newScale === 1) {
                setPosition({ x: 0, y: 0 });
            }
        } else if (e.touches.length === 1 && isDragging.current && scale > 1) {
            const deltaX = e.touches[0].clientX - lastPosition.current.x;
            const deltaY = e.touches[0].clientY - lastPosition.current.y;
            setPosition(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
            lastPosition.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, [scale]);

    const handleTouchEnd = useCallback(() => {
        lastTouchDistance.current = null;
        lastTouchCenter.current = null;
        isDragging.current = false;
    }, []);

    // 더블클릭/더블탭으로 확대/축소
    const handleDoubleClick = useCallback(() => {
        if (scale > 1) {
            setScale(1);
            setPosition({ x: 0, y: 0 });
        } else {
            setScale(2);
        }
    }, [scale]);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
            >
                <X className="size-6" />
            </button>

            {/* Zoom hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {scale > 1 ? `${Math.round(scale * 100)}%` : '더블클릭/핀치로 확대'}
            </div>

            {/* Image container */}
            <div
                ref={containerRef}
                className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    src={src}
                    alt={alt}
                    className="max-w-full max-h-full object-contain select-none transition-transform duration-100"
                    style={{
                        transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                    }}
                    draggable={false}
                />
            </div>
        </div>
    );
}

export function PortfolioViewer({ images, onClose, showCloseButton = true }: PortfolioViewerProps) {
    const totalImages = images.length;
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);

    // 스크롤 위치 복원
    useEffect(() => {
        const savedPosition = localStorage.getItem(SCROLL_POSITION_KEY);
        if (savedPosition && scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = parseInt(savedPosition, 10);
        }
    }, []);

    // 스크롤 위치 저장
    const handleScroll = useCallback(() => {
        if (scrollContainerRef.current) {
            localStorage.setItem(SCROLL_POSITION_KEY, scrollContainerRef.current.scrollTop.toString());
        }
    }, []);

    // ESC 키로 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose && !lightboxImage) onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, lightboxImage]);

    return (
        <div className="flex flex-col h-full bg-[var(--ivory-100)]">
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-[var(--ivory-400)]">
                <div className="flex items-center gap-2">
                    <FileImage className="size-5 text-[var(--ivory-700)]" />
                    <span className="font-medium text-[var(--ivory-900)]">포트폴리오</span>
                    <span className="text-sm text-[var(--ivory-600)]">
                        ({totalImages}장)
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {/* PDF Download Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="size-8"
                        title="PDF 다운로드"
                    >
                        <a href="/portfolio.pdf" download>
                            <Download className="size-4" />
                        </a>
                    </Button>
                    {showCloseButton && onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="size-8"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Scrollable Image List */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {images.map((src, idx) => (
                    <div
                        key={idx}
                        className="relative cursor-zoom-in group"
                        onClick={() => setLightboxImage({ src, alt: `Portfolio page ${idx + 1}` })}
                    >
                        {/* Page number badge */}
                        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md z-10">
                            {idx + 1} / {totalImages}
                        </div>
                        {/* Zoom hint overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                            <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1.5 rounded-full text-sm transition-opacity">
                                🔍 크게 보기
                            </span>
                        </div>
                        <img
                            src={src}
                            alt={`Portfolio page ${idx + 1}`}
                            className="w-full rounded-lg shadow-md"
                            loading="lazy"
                            draggable={false}
                        />
                    </div>
                ))}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <ImageLightbox
                    src={lightboxImage.src}
                    alt={lightboxImage.alt}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </div>
    );
}

// 모바일용 플로팅 버튼
export function PortfolioFloatingButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-24 right-4 z-40 px-4 py-3 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 active:scale-95 transition-all flex items-center gap-2 md:hidden"
            aria-label="포트폴리오 보기"
        >
            <Briefcase className="size-5" />
            <span className="text-sm font-medium">포트폴리오</span>
        </button>
    );
}

// 모바일용 오버레이 모달
export function PortfolioModal({ isOpen, onClose, images }: { isOpen: boolean; onClose: () => void; images: string[] }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />
            {/* Content */}
            <div className="absolute inset-2 top-4 bottom-4 bg-[var(--ivory-100)] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <PortfolioViewer images={images} onClose={onClose} />
            </div>
        </div>
    );
}

// PC용 사이드 패널 (리사이즈 가능)
const MIN_WIDTH = 300;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 800;

export function PortfolioSidePanel({
    isOpen,
    onToggle,
    images,
}: {
    isOpen: boolean;
    onToggle: () => void;
    images: string[];
}) {
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const isResizing = useRef(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const startResize = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current) return;

            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            if (isResizing.current) {
                isResizing.current = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    return (
        <>
            {/* Toggle Button (visible when closed) */}
            {!isOpen && (
                <button
                    onClick={onToggle}
                    className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 items-center gap-1 bg-primary-600 text-white px-2 py-4 rounded-l-lg shadow-lg hover:bg-primary-700 transition-colors"
                    style={{ writingMode: 'vertical-rl' }}
                >
                    <FileImage className="size-4 rotate-90" />
                    <span className="text-sm font-medium">포트폴리오</span>
                </button>
            )}

            {/* Side Panel */}
            {isOpen && (
                <div
                    ref={panelRef}
                    className="hidden md:flex flex-col h-full border-l border-[var(--ivory-400)] bg-[var(--ivory-100)] relative"
                    style={{ width: `${width}px` }}
                >
                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResize}
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-primary-500/20 active:bg-primary-500/30 flex items-center justify-center group z-10"
                        title="드래그하여 너비 조절"
                    >
                        <GripVertical className="size-4 text-[var(--ivory-500)] group-hover:text-primary-600 transition-colors" />
                    </div>

                    <PortfolioViewer images={images} onClose={onToggle} />
                </div>
            )}
        </>
    );
}
