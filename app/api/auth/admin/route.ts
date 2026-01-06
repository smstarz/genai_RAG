import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { password } = await req.json();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            return NextResponse.json(
                { success: false, message: '관리자 비밀번호가 설정되지 않았습니다.' },
                { status: 500 }
            );
        }

        if (password === adminPassword) {
            // 간단한 토큰 생성 (실제 프로덕션에서는 JWT 사용 권장)
            const token = Buffer.from(`admin:${Date.now()}`).toString('base64');

            const response = NextResponse.json({ success: true, token });

            // HTTP-only 쿠키로 토큰 설정
            response.cookies.set('admin_token', token, {
                httpOnly: true,
                secure: false, // LAN 접속(HTTP)을 위해 false로 설정. SSL 적용 시 true로 변경 필요
                sameSite: 'lax', // strict 하에서는 다른 도메인/IP 진입 시 쿠키 제한될 수 있으므로 lax 권장
                maxAge: 60 * 60 * 24, // 24시간
            });

            return response;
        }

        return NextResponse.json(
            { success: false, message: '비밀번호가 올바르지 않습니다.' },
            { status: 401 }
        );
    } catch (error) {
        console.error('Auth error:', error);
        return NextResponse.json(
            { success: false, message: '인증 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 인증 상태 확인
export async function GET(req: Request) {
    const token = req.headers.get('cookie')?.split('; ')
        .find(c => c.startsWith('admin_token='))
        ?.split('=')[1];

    if (token) {
        try {
            const decoded = Buffer.from(token, 'base64').toString();
            if (decoded.startsWith('admin:')) {
                return NextResponse.json({ authenticated: true });
            }
        } catch {
            // Invalid token
        }
    }

    return NextResponse.json({ authenticated: false });
}

// 로그아웃
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_token');
    return response;
}
