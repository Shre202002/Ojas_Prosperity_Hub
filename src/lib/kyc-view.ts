'use client';

import type { KycDocType } from '@/lib/kyc-docs';

/** Opens a KYC document through our own API (auth header + access check) in a new tab. The storage URL is never exposed. */
export async function openKycDocument(submissionId: string, type: KycDocType) {
  const popup = window.open('', '_blank'); // open synchronously so popup blockers allow it
  try {
    const res = await fetch(`/api/kyc/file?id=${encodeURIComponent(submissionId)}&type=${type}`, { headers: { Authorization: `Bearer ${localStorage.getItem('sjapl_session_token') || ''}` } });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Could not open the document.');
    const url = URL.createObjectURL(await res.blob());
    if (popup) popup.location.href = url; else window.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    popup?.close();
    throw error;
  }
}
