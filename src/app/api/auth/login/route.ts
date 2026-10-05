import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth/stub';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' },
        { status: 400 }
      );
    }

    const result = await authService.login({ email, password, rememberMe });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'بيانات الدخول غير صحيحة.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true, user: result.user });

    // Set secure HTTP-only cookie
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    response.cookies.set('mohasby_session', JSON.stringify(result.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع في الخادم.' },
      { status: 500 }
    );
  }
}
