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
    const { fingerprint, latitude, longitude, userAgent } = data;
    
    if (!fingerprint) {
      return NextResponse.json({ error: 'Fingerprint is required' }, { status: 400 });
    }
    
    const log = await prisma.viewerLog.create({
      data: {
        fingerprint,
        latitude,
        longitude,
        userAgent
      }
    });
    
    return NextResponse.json({ success: true, log });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
