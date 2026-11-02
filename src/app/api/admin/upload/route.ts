import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Admin-only image upload (hero banners, product photos). Stores the file on ImageKit and returns its public URL.
export async function POST(request: NextRequest) {
  try {
    await requireAdmin(request);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
    if (!TYPES.includes(file.type)) return NextResponse.json({ error: 'Image must be JPG, PNG or WEBP.' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be smaller than 5MB.' }, { status: 400 });
    if (!process.env.Imagekit_PRIVATE_KEY) return NextResponse.json({ error: 'Image storage (ImageKit) is not configured on the server.' }, { status: 503 });

    const body = new FormData();
    body.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name);
    body.append('fileName', `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`);
    body.append('folder', '/sjapl/site');
    const auth = Buffer.from(`${process.env.Imagekit_PRIVATE_KEY}:`).toString('base64');
    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', headers: { Authorization: `Basic ${auth}` }, body });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: result.message || 'Image upload failed.' }, { status: 502 });
    return NextResponse.json({ url: result.url });
  } catch (error: any) {
    const message = String(error?.message || '');
    const status = /Authentication/i.test(message) ? 401 : /Admin|permission|forbidden/i.test(message) ? 403 : 500;
    return NextResponse.json({ error: status === 500 ? 'Upload failed.' : message }, { status });
  }
}
