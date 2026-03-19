import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import cloudinary from '@/lib/cloudinary';
import { File } from 'buffer';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const maybeFile = formData.get('file');
    const file = maybeFile instanceof File ? maybeFile : null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer: Buffer = Buffer.from(await file.arrayBuffer());

    const tempFilename: string = `${Date.now()}-${file.name}`;
    const tempPath: string = path.join(os.tmpdir(), tempFilename);
    await writeFile(tempPath, buffer);

    const result = await cloudinary.uploader.upload(tempPath, {
      resource_type: 'auto',
      folder: 'nextjs_uploads', // optional
    });

    await unlink(tempPath).catch(() => {});

    return NextResponse.json({
      success: true,
      filePath: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('Cloudinary upload error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
