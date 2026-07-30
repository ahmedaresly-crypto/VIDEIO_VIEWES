import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function streamFile(filepath: string, options?: any): ReadableStream<Uint8Array> {
  const stream = fs.createReadStream(filepath, options);
  return new ReadableStream({
    start(controller) {
      stream.on('data', (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      stream.on('end', () => controller.close());
      stream.on('error', (err: any) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    }
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ filename: string }> }) {
  const resolvedParams = await params;
  const filepath = path.join(process.cwd(), 'public', 'uploads', resolvedParams.filename);
  
  if (!fs.existsSync(filepath)) {
    return new NextResponse('File not found', { status: 404 });
  }
  
  const stat = fs.statSync(filepath);
  const fileSize = stat.size;
  const range = req.headers.get('range');
  
  let extension = path.extname(filepath).toLowerCase();
  let contentType = 'video/mp4';
  if (extension === '.webm') contentType = 'video/webm';
  if (extension === '.ogg') contentType = 'video/ogg';
  
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] && parts[1] !== "" ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    
    const fileStream = streamFile(filepath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize.toString(),
      'Content-Type': contentType,
    };
    return new NextResponse(fileStream, { status: 206, headers: head });
  } else {
    const head = {
      'Content-Length': fileSize.toString(),
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
    };
    const fileStream = streamFile(filepath);
    return new NextResponse(fileStream, { headers: head });
  }
}
