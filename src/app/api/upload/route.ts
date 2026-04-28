import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';
import cloudinary from '@/lib/cloudinary';
import { File } from 'buffer';
import { CustomNextRequest, ISessionUser } from '@/types/server';
import { logger } from '@/utils/logger/logger';
import { getDataFromToken } from '@/utils/getDataFromToken';

export const config = {
  api: {
    bodyParser: false,
  },
};
// Design upload function to handle file uploads to Cloudinary individually for both images and the videos and return the secure URL of the uploaded file in the response. Ensure that the function can handle large files efficiently and includes error handling for potential upload failures.///
const MAX_SYNC_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export async function POST(request: CustomNextRequest): Promise<NextResponse> {
  try {

    const user: ISessionUser | null = await getDataFromToken(request);
    if (!user || !user.id) {
      logger.error("Unautorized access", { ip: request.ip });
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }
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

    await unlink(tempPath).catch(() => { });
    logger.info('File uploaded successfully', { filePath: result.secure_url, public_id: result.public_id });
    return NextResponse.json({
      success: true,
      filePath: result.secure_url,
      public_id: result.public_id,
    }, { status: 200 });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Cloudinary upload error:', { error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
