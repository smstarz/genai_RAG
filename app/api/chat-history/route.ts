import { NextResponse } from 'next/server';
import { getChat, saveChat, deleteChat, isKVConfigured } from '@/lib/kv';

// GET: 채팅 히스토리 조회
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const messages = await getChat(sessionId);

    return NextResponse.json({
        messages: messages || [],
        kvConfigured: isKVConfigured(),
    });
}

// POST: 채팅 히스토리 저장
export async function POST(req: Request) {
    try {
        const { sessionId, messages } = await req.json();

        if (!sessionId || !messages) {
            return NextResponse.json(
                { error: 'sessionId and messages are required' },
                { status: 400 }
            );
        }

        const success = await saveChat(sessionId, messages);

        return NextResponse.json({
            success,
            kvConfigured: isKVConfigured(),
        });
    } catch (error) {
        console.error('Chat history save error:', error);
        return NextResponse.json(
            { error: 'Failed to save chat history' },
            { status: 500 }
        );
    }
}

// DELETE: 채팅 히스토리 삭제
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
        return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    const success = await deleteChat(sessionId);

    return NextResponse.json({ success });
}
