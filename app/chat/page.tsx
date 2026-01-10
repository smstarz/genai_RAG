import fs from 'fs';
import path from 'path';
import ChatClient from './ChatClient';

// 포트폴리오 이미지 목록을 서버에서 읽어옴
function getPortfolioImages(): string[] {
    const portfolioDir = path.join(process.cwd(), 'public/portfolio');

    try {
        const files = fs.readdirSync(portfolioDir);
        return files
            .filter(f => f.toLowerCase().endsWith('.webp'))
            .sort()
            .map(f => `/portfolio/${f}`);
    } catch (error) {
        console.error('Failed to read portfolio directory:', error);
        return [];
    }
}

export default function ChatPage() {
    const portfolioImages = getPortfolioImages();

    return <ChatClient portfolioImages={portfolioImages} />;
}
