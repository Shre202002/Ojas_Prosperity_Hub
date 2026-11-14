// Shared by the KYC form and /api/kyc so the rules cannot drift.
export const ID_TYPES = [
  { value: 'pan', label: 'PAN Card', placeholder: 'ABCDE1234F' },
  { value: 'aadhaar', label: 'Aadhaar Card', placeholder: '1234 5678 9012' },
  { value: 'passport', label: 'Passport', placeholder: 'A1234567' },
  { value: 'voter', label: 'Voter ID', placeholder: 'ABC1234567' },
  { value: 'dl', label: 'Driving Licence', placeholder: 'RJ1420110012345' },
] as const;

export const ADDRESS_TYPES = [
  { value: 'aadhaar', label: 'Aadhaar Card', numberLabel: 'Aadhaar number' },
  { value: 'utility', label: 'Utility Bill', numberLabel: 'Consumer / account number' },
  { value: 'bank', label: 'Bank Statement', numberLabel: 'Account number (last 4+ digits)' },
  { value: 'passport', label: 'Passport', numberLabel: 'Passport number' },
  { value: 'dl', label: 'Driving Licence', numberLabel: 'Licence number' },
  { value: 'rent', label: 'Rent Agreement', numberLabel: 'Agreement number' },
] as const;

export type IdType = (typeof ID_TYPES)[number]['value'];
export type AddressType = (typeof ADDRESS_TYPES)[number]['value'];
export type Check = { ok: true; value: string } | { ok: false; message: string };

const clean = (v: string) => v.toUpperCase().replace(/[\s-]/g, '');
const ID_PATTERNS: Record<IdType, { re: RegExp; message: string }> = {
  pan: { re: /^[A-Z]{5}[0-9]{4}[A-Z]$/, message: 'Enter a valid 10-character PAN, e.g. ABCDE1234F.' },
  aadhaar: { re: /^[2-9][0-9]{11}$/, message: 'Enter a valid 12-digit Aadhaar number.' },
  passport: { re: /^[A-Z][0-9]{7}$/, message: 'Enter a valid passport number, e.g. A1234567.' },
  voter: { re: /^[A-Z]{3}[0-9]{7}$/, message: 'Enter a valid Voter ID, e.g. ABC1234567.' },
  dl: { re: /^[A-Z]{2}[0-9]{2}[0-9]{11}$/, message: 'Enter a valid driving licence number, e.g. RJ1420110012345.' },
};

export const isIdType = (v: unknown): v is IdType => ID_TYPES.some((t) => t.value === v);
export const isAddressType = (v: unknown): v is AddressType => ADDRESS_TYPES.some((t) => t.value === v);

export function checkIdNumber(type: unknown, raw: string): Check {
  if (!isIdType(type)) return { ok: false, message: 'Choose the ID proof type.' };
  const value = clean(raw);
  if (!value) return { ok: false, message: 'Enter the ID number.' };
  const rule = ID_PATTERNS[type];
  return rule.re.test(value) ? { ok: true, value } : { ok: false, message: rule.message };
}

export function checkAddressProofNumber(type: unknown, raw: string): Check {
  if (!isAddressType(type)) return { ok: false, message: 'Choose the address proof type.' };
  const value = clean(raw);
  if (value.length < 4) return { ok: false, message: 'Enter the document number (at least 4 characters).' };
  if (type === 'aadhaar' && !ID_PATTERNS.aadhaar.re.test(value)) return { ok: false, message: ID_PATTERNS.aadhaar.message };
  if (type === 'passport' && !ID_PATTERNS.passport.re.test(value)) return { ok: false, message: ID_PATTERNS.passport.message };
  return { ok: true, value };
}

export function checkAddress(raw: string): Check {
  const value = raw.trim().replace(/\s+/g, ' ');
  return value.length >= 15 ? { ok: true, value } : { ok: false, message: 'Enter your complete residential address (at least 15 characters).' };
}

export const DOC_LABELS = {
  idProof: 'ID proof',
  addressProof: 'Address proof',
  selfie: 'Live selfie',
} as const;
