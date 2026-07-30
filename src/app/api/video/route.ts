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
      return NextResponse.json({ videoUrl: newSettings.videoUrl, title: null, thumbnailUrl: null });
    }
    
    return NextResponse.json({ videoUrl: settings.videoUrl, title: settings.title, thumbnailUrl: settings.thumbnailUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { videoUrl, title, thumbnailUrl } = await req.json();
    
    const updateData: any = {};
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
    if (title !== undefined) updateData.title = title;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;

    const settings = await prisma.settings.upsert({
      where: { key: 'global' },
      update: updateData,
      create: { key: 'global', ...updateData, videoUrl: videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4" },
    });
    
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("Error in POST /api/video:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
