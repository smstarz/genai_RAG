import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

// 스토어 목록 조회
export async function GET() {
    try {
        const stores = await ai.fileSearchStores.list();
        const storeList = [];

        for await (const store of stores) {
            storeList.push(store);
        }

        return NextResponse.json({ stores: storeList });
    } catch (error) {
        console.error('Store list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stores', stores: [] },
            { status: 500 }
        );
    }
}

// 스토어 생성
export async function POST(req: Request) {
    try {
        const { displayName } = await req.json();

        if (!displayName) {
            return NextResponse.json(
                { error: 'Display name is required' },
                { status: 400 }
            );
        }

        const store = await ai.fileSearchStores.create({
            config: { displayName },
        });

        return NextResponse.json({ store });
    } catch (error) {
        console.error('Store create error:', error);
        return NextResponse.json(
            { error: 'Failed to create store' },
            { status: 500 }
        );
    }
}
