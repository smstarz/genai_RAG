import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

// 스토어 삭제
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const storeName = `fileSearchStores/${id}`;

        await ai.fileSearchStores.delete({
            name: storeName,
            config: { force: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Store delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete store' },
            { status: 500 }
        );
    }
}
