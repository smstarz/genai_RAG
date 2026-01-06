import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

// 파일 삭제 - documents.delete 사용
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json(
                { error: 'Store ID is required' },
                { status: 400 }
            );
        }

        // documents.delete 사용 - name에 전체 경로 전달
        // force: true 옵션으로 청크가 있는 문서도 함께 삭제
        const fullDocumentName = id.startsWith('fileSearchStores/') ? id : `${storeId}/documents/${id}`;
        await ai.fileSearchStores.documents.delete({
            name: fullDocumentName,
            config: { force: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('File delete error:', error);
        return NextResponse.json(
            { error: 'Failed to delete file' },
            { status: 500 }
        );
    }
}
