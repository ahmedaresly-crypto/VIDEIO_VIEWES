import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const logs = await prisma.viewerLog.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { fingerprint, latitude, longitude, userAgent, screenResolution, language, timezone } = data;
    
    if (!fingerprint) {
      return NextResponse.json({ error: 'Fingerprint is required' }, { status: 400 });
    }
    
    // Get IP address from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0] : (req.headers.get('x-real-ip') || 'Unknown IP');

    const log = await prisma.viewerLog.create({
      data: {
        fingerprint,
        latitude,
        longitude,
        userAgent,
        ip,
        screenResolution,
        language,
        timezone
      }
    });
    
    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (id) {
      await prisma.viewerLog.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, message: 'Log deleted' });
    } else {
      await prisma.viewerLog.deleteMany({});
      return NextResponse.json({ success: true, message: 'All logs cleared' });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
