import { NextResponse } from 'next/server';
import { ai } from '@/lib/gemini';

// 파일 목록 조회 - documents를 사용
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        if (!storeId) {
            return NextResponse.json(
                { error: 'Store ID is required', files: [] },
                { status: 400 }
            );
        }

        // documents.list 사용
        const documents = await ai.fileSearchStores.documents.list({ parent: storeId });
        const fileList = [];

        for await (const doc of documents) {
            fileList.push(doc);
        }

        return NextResponse.json({ files: fileList });
    } catch (error) {
        console.error('File list error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch files', files: [] },
            { status: 500 }
        );
    }
}

// 파일 업로드 - uploadToFileSearchStore 사용
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const storeId = formData.get('storeId') as string;

        if (!file || !storeId) {
            return NextResponse.json(
                { error: 'File and Store ID are required' },
                { status: 400 }
            );
        }

        // 파일을 Blob으로 변환
        const arrayBuffer = await file.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: file.type || 'application/octet-stream' });

        // uploadToFileSearchStore 사용
        const operation = await ai.fileSearchStores.uploadToFileSearchStore({
            fileSearchStoreName: storeId,
            file: blob,
            config: {
                displayName: file.name,
            },
        });

        // 작업 완료 대기 (max 30초)
        let result = operation;
        let attempts = 0;
        while (!result.done && attempts < 6) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            result = await ai.operations.get({ operation: result });
            attempts++;
        }

        return NextResponse.json({
            success: result.done,
            document: result.done ? { uploadComplete: true } : null
        });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
