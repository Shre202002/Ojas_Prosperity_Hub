export const KYC_DOC_TYPES = ['idProof', 'addressProof', 'selfie'] as const;
export type KycDocType = (typeof KYC_DOC_TYPES)[number];

/** What the browser may know about a stored document: that it exists and its filename, never where it is stored. */
export type PublicDocument = { uploaded: true; filename: string; mime?: string };

/** Strips storage details (URL, file id, path) from a KYC submission before it is sent to any client. */
export function publicSubmission<T extends Record<string, any> | null | undefined>(submission: T): T {
  if (!submission) return submission;
  const out: Record<string, any> = { ...submission };
  for (const type of KYC_DOC_TYPES) {
    const doc = out[type];
    out[type] = doc && (doc.url || doc.fileId || doc.uploaded) ? ({ uploaded: true, filename: doc.filename || '', mime: doc.mime } satisfies PublicDocument) : undefined;
    if (out[type] === undefined) delete out[type];
  }
  return out as T;
}
