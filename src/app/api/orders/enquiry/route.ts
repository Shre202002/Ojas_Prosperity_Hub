import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { collection } from '@/lib/mongodb';
import { getProductsByIds } from '@/lib/catalog';
import { sendMail } from '@/lib/mailer';
import { storeInbox } from '@/lib/site-config';
import { HOUR_MS, PHONE_PATTERN, clientIp, escapeHtml, hashIp, makeReference } from '@/lib/public-forms';

export const runtime = 'nodejs';

const schema = z.object({
  items: z.array(z.object({ id: z.string().min(1).max(64), qty: z.coerce.number().int().min(1).max(20) })).min(1, 'Your cart is empty.').max(20),
  customer: z.object({
    name: z.string().trim().min(2, 'Enter your name.').max(80),
    phone: z.string().trim().regex(PHONE_PATTERN, 'Enter a valid phone number.'),
    email: z.string().trim().email('Enter a valid email address.').max(120).optional().or(z.literal('')),
    address: z.string().trim().min(10, 'Enter your full delivery address.').max(300),
    city: z.string().trim().min(2, 'Enter your city.').max(60),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a 6-digit pincode.'),
    notes: z.string().trim().max(500).optional(),
  }),
  website: z.string().optional(), // honeypot: real visitors never fill this in
});

const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

// Public endpoint: stores an order enquiry (no payment). Prices and stock always come from the database, never from the client.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return fail('Send the order as JSON.');
  // A filled honeypot means a bot: answer as if it worked, store nothing.
  if (typeof body.website === 'string' && body.website.trim()) return NextResponse.json({ ref: 'ENQ-RECEIVED', total: 0 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message || 'Check the details and try again.');
  const { items, customer } = parsed.data;

  const store = await collection<any>('orderEnquiries');
  const ipHash = hashIp(clientIp(request));
  const since = new Date(Date.now() - HOUR_MS);
  const [byIp, byPhone] = await Promise.all([
    store.countDocuments({ ipHash, createdAt: { $gte: since } }),
    store.countDocuments({ 'customer.phone': customer.phone, createdAt: { $gte: since } }),
  ]);
  if (byIp >= 5 || byPhone >= 3) return fail('You have sent several orders recently. Please wait a while, or contact us directly.', 429);

  // Merge duplicate lines, then price everything from the catalogue.
  const wanted = new Map<string, number>();
  for (const { id, qty } of items) wanted.set(id, Math.min(20, (wanted.get(id) || 0) + qty));
  const products = await getProductsByIds([...wanted.keys()]);
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = [];
  for (const [id, qty] of wanted) {
    const product = byId.get(id);
    if (!product) return fail('One of the products in your cart is no longer available. Remove it and try again.');
    if (!product.inStock) return fail(`${product.name} is out of stock.`);
    if (product.stock !== null && qty > product.stock) return fail(`Only ${product.stock} of ${product.name} left in stock.`);
    if (product.maxOrderQty && qty > product.maxOrderQty) return fail(`You can order up to ${product.maxOrderQty} of ${product.name} at a time.`);
    lines.push({ id, name: product.name, sku: product.sku, qty, unitPrice: product.price, lineTotal: Math.round(product.price * qty * 100) / 100 });
  }
  const total = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  const ref = makeReference('ENQ');
  await store.insertOne({ ref, items: lines, total, customer: { ...customer, email: customer.email || '' }, status: 'new', ipHash, createdAt: new Date() });

  // Email the store. A mail failure must not lose or reject the order: it is already saved above.
  const inbox = storeInbox();
  if (inbox) {
    const text = [
      `New order enquiry ${ref}`, '',
      ...lines.map((l) => `${l.qty} x ${l.name} (${l.sku || 'no SKU'}) @ Rs ${l.unitPrice} = Rs ${l.lineTotal}`),
      `Total: Rs ${total}`, '',
      `Name: ${customer.name}`, `Phone: ${customer.phone}`, `Email: ${customer.email || '-'}`,
      `Address: ${customer.address}, ${customer.city} ${customer.pincode}`, `Notes: ${customer.notes || '-'}`,
    ].join('\n');
    try { await sendMail({ to: inbox, subject: `Order enquiry ${ref}: Rs ${total}`, text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>` }); }
    catch (error) { console.error('[orders] could not email the store:', error); }
  } else {
    console.info('[orders] STORE_EMAIL is not set; the enquiry was saved to the database only.');
  }

  return NextResponse.json({ ref, total }, { status: 201 });
}
