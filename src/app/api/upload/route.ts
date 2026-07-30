import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم العثور على ملف' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.name) || '.mp4';
    const filename = `video-${uniqueSuffix}${extension}`;

    // Path to save
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure directory exists
    try {
      await require('fs/promises').mkdir(uploadDir, { recursive: true });
    } catch (e) {}

    const filepath = path.join(uploadDir, filename);

    // Save to disk
    await writeFile(filepath, buffer);

    // Update database with the new local URL
    const videoUrl = `/api/file/${filename}`;
    await prisma.settings.upsert({
      where: { key: 'global' },
      update: { videoUrl },
      create: { key: 'global', videoUrl },
    });

    return NextResponse.json({ success: true, videoUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء رفع الملف' }, { status: 500 });
  }
}
