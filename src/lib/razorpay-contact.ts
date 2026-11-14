import { parsePhoneNumber } from 'react-phone-number-input';

/** Razorpay's documented prefill format is the full international number (+919000090000), so pass that for every country. */
export function razorpayContact(phone: string) {
  try { return parsePhoneNumber(phone)?.number || phone; } catch { return phone; }
}
