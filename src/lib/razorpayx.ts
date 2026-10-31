const BASE = 'https://api.razorpay.com/v1';

const keyId = () => process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
const keySecret = () => process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
const accountNumber = () => process.env.RAZORPAYX_ACCOUNT_NUMBER || '';

export const payoutsConfigured = () => Boolean(keyId() && keySecret() && accountNumber());

// 4xx = Razorpay rejected the request (bad UPI, no funds...), so retrying can't help; anything else may be transient.
export class PayoutError extends Error {
  constructor(message: string, public permanent: boolean) { super(message); }
}

async function call(path: string, body: unknown, idempotencyKey?: string) {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${keyId()}:${keySecret()}`).toString('base64')}`,
        ...(idempotencyKey ? { 'X-Payout-Idempotency': idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (error: any) {
    throw new PayoutError(error?.message || 'Could not reach the payout service.', false);
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new PayoutError(result?.error?.description || `Payout service error (${response.status}).`, response.status >= 400 && response.status < 500);
  }
  return result;
}

type PayoutInput = { withdrawalId: string; userId: string; name: string; email?: string; upi: string; amount: number };

// shortcut: a contact + fund account are created per payout; cache them on the distributor if volume grows.
export async function createUpiPayout({ withdrawalId, userId, name, email, upi, amount }: PayoutInput) {
  const contact = await call('/contacts', { name, ...(email ? { email } : {}), type: 'customer', reference_id: userId });
  const fundAccount = await call('/fund_accounts', { contact_id: contact.id, account_type: 'vpa', vpa: { address: upi } });
  // Same idempotency key on every retry, so one withdrawal can never be paid twice.
  const payout = await call('/payouts', {
    account_number: accountNumber(),
    fund_account_id: fundAccount.id,
    amount: Math.round(amount * 100),
    currency: 'INR',
    mode: 'UPI',
    purpose: 'payout',
    queue_if_low_balance: true,
    reference_id: withdrawalId,
    narration: 'SJAPL payout',
  }, withdrawalId);
  return { payoutId: String(payout.id), status: String(payout.status || 'queued') };
}
