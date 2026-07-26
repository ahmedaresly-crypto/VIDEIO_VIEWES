import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: { videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4" }
      });
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
    
    let settings = await prisma.settings.findFirst();
    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data: { videoUrl }
      });
    } else {
      settings = await prisma.settings.create({
        data: { videoUrl }
      });
    }
    
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
