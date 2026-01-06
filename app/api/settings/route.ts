import { NextResponse } from 'next/server';
import { getSettings, saveSettings } from '@/lib/settings';

// GET: 현재 설정 조회
export async function GET() {
    try {
        const settings = await getSettings();
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to read settings:', error);
        return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
    }
}

// POST: 설정 업데이트
export async function POST(req: Request) {
    try {
        const body = await req.json();
        await saveSettings(body);
        const newSettings = await getSettings();
        return NextResponse.json({ success: true, settings: newSettings });
    } catch (error) {
        console.error('Failed to save settings:', error);
        return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }
}
