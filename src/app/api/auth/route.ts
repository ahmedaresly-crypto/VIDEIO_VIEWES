import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, password, currentPassword, newPassword } = body;

    const settings = await prisma.settings.findUnique({
      where: { key: 'global' }
    });
    
    const correctPassword = settings?.adminPassword || 'admin123';

    // 1. Handle Login
    if (action === 'login') {
      if (password === correctPassword) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
      }
    }

    // 2. Handle Change Password
    if (action === 'change_password') {
      if (currentPassword !== correctPassword) {
        return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 400 });
      }

      if (!newPassword || newPassword.trim().length < 4) {
        return NextResponse.json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 4 أحرف/أرقام على الأقل' }, { status: 400 });
      }

      await prisma.settings.upsert({
        where: { key: 'global' },
        update: { adminPassword: newPassword.trim() },
        create: { key: 'global', adminPassword: newPassword.trim() }
      });

      return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
