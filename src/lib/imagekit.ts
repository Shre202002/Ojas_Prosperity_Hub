import { createHmac } from 'crypto';

// Server-only ImageKit helper for KYC documents. Files are uploaded as PRIVATE (no public URL works without a
// signature), and the browser never receives an ImageKit URL: documents are streamed by /api/kyc/file after an access check.
const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

const privateKey = () => {
  const key = process.env.Imagekit_PRIVATE_KEY;
  if (!key) throw new Error('File storage is not configured.');
  return key;
};
const basicAuth = () => `Basic ${Buffer.from(`${privateKey()}:`).toString('base64')}`;

export type StoredDocument = { url: string; fileId: string; path: string; filename: string; mime: string; size: number };

export const ALLOWED_KYC_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_KYC_BYTES = 8 * 1024 * 1024;

/** Validates and uploads one KYC file as a private ImageKit file. Never returns anything meant for the browser. */
export async function uploadKycFile(file: File, uid: string, type: string): Promise<StoredDocument> {
  if (file.size > MAX_KYC_BYTES) throw new Error(`${type} must be smaller than 8MB.`);
  if (!ALLOWED_KYC_MIME.includes(file.type)) throw new Error(`${type} must be JPG, PNG, WEBP, or PDF.`);
  const body = new FormData();
  body.append('file', new Blob([await file.arrayBuffer()], { type: file.type }), file.name);
  body.append('fileName', `${uid}-${type}-${Date.now()}-${file.name}`);
  body.append('folder', `/sjapl/kyc/${uid}`);
  body.append('isPrivateFile', 'true');
  const response = await fetch(UPLOAD_URL, { method: 'POST', headers: { Authorization: basicAuth() }, body });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'File upload failed.');
  return { url: result.url, fileId: result.fileId, path: result.filePath, filename: file.name, mime: file.type, size: file.size };
}

/** ImageKit signed URL: the signature covers the path relative to the URL endpoint plus the expiry timestamp. */
export function signedUrl(url: string, endpoint: string, seconds = 60) {
  const expire = Math.floor(Date.now() / 1000) + seconds;
  const relative = url.startsWith(endpoint) ? url.slice(endpoint.length) : url;
  const signature = createHmac('sha1', privateKey()).update(relative + String(expire)).digest('hex');
  return `${url}${url.includes('?') ? '&' : '?'}ik-s=${signature}&ik-t=${expire}`;
}

/** The URL endpoint is the prefix of an uploaded file's URL up to its path. */
export function endpointOf(url: string, path?: string) {
  if (path && url.includes(path)) return url.slice(0, url.indexOf(path)).replace(/\/?$/, '/');
  const m = url.match(/^(https:\/\/ik\.imagekit\.io\/[^/]+\/)/);
  return m ? m[1] : url.slice(0, url.indexOf('/', 8) + 1);
}

/** Fetches a stored document's bytes server-side (signed, short-lived). */
export async function fetchStoredDocument(doc: Partial<StoredDocument>) {
  if (!doc.url) throw new Error('Document not found.');
  const endpoint = endpointOf(doc.url, doc.path);
  const attempts = [signedUrl(doc.url, endpoint), doc.url]; // the plain URL covers legacy public files
  for (const url of attempts) {
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) return res;
  }
  throw new Error('Document could not be loaded.');
}
