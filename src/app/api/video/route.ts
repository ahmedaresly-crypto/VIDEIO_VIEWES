import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { key: 'global' }
    });
    
    if (!settings) {
      const newSettings = await prisma.settings.create({
        data: { key: 'global', videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
      });
      return NextResponse.json({ videoUrl: newSettings.videoUrl });
    }
    
    return NextResponse.json({ videoUrl: settings.videoUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { videoUrl } = await req.json();
    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }
    
    const settings = await prisma.settings.upsert({
      where: { key: 'global' },
      update: { videoUrl },
      create: { key: 'global', videoUrl },
    });
    
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error in POST /api/video:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
