import { NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import cloudinary from '@/lib/cloudinary';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const tempFilename = `${Date.now()}-${file.name}`;
    const tempPath = path.join(os.tmpdir(), tempFilename);
    await writeFile(tempPath, buffer);

    const result = await cloudinary.uploader.upload(tempPath, {
      resource_type: 'auto',
      folder: 'nextjs_uploads', // optional
    });

    await unlink(tempPath);

    return NextResponse.json({
      success: true,
      filePath: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
