// Integration tests: boots the real Next.js server against an ISOLATED MongoDB database and drives the HTTP API.
// Run:  npm run test:integration
// Safe: uses database "ojas_integration_test" (dropped at the end); external services (Razorpay/RazorpayX, ImageKit,
// SMTP) are disabled via env so nothing outside this machine + that test DB is touched.
import 'dotenv/config';
import { before, after, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';

const PORT = Number(process.env.IT_PORT || 9004);
const BASE = `http://localhost:${PORT}`;
const TEST_DB = 'ojas_integration_test';
const ADMIN_EMAIL = 'it-admin@test.local';
const WEBHOOK_SECRET = 'it-webhook-secret';
const KEY_SECRET = 'it-key-secret';
const PASSWORD = 'Passw0rd!';
const RATE = 20; // ₹ per BV, used for both package pricing (bv_rate) and BV->INR conversion (settings)
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI is required (set it in .env).');

let server, serverLog = '', mongo, db;
const rnd = () => crypto.randomBytes(4).toString('hex');

// ---------------------------------------------------------------- helpers
async function api(method, path, { token, json, form, headers = {}, raw } = {}) {
  const init = { method, headers: { ...headers }, signal: AbortSignal.timeout(240_000) };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (json !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(json); }
  if (form) init.body = form;
  if (raw !== undefined) init.body = raw;
  const res = await fetch(BASE + path, init);
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, ok: res.ok };
}
const denied = (res) => assert.ok(res.status >= 400 && res.status < 500, `expected 4xx, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
const sign = (secret, payload) => crypto.createHmac('sha256', secret).update(payload).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function register(email, password = PASSWORD, name = 'Test User') {
  const res = await api('POST', '/api/auth', { json: { mode: 'register', email, password, name } });
  assert.equal(res.status, 200, `register ${email}: ${JSON.stringify(res.body)}`);
  return { token: res.body.token, uid: res.body.user.uid, email, role: res.body.user.role };
}
async function login(email, password) { return api('POST', '/api/auth', { json: { mode: 'login', email, password } }); }

// Simulates "order created" (normally done through Razorpay) then pays it through the signed webhook.
async function payOrder(packageId, { capture = true } = {}) {
  const pkg = await db.collection('packages').findOne({ id: packageId });
  const price = pkg.bv * RATE;
  const orderId = `order_${rnd()}${rnd()}`;
  await db.collection('transactions').insertOne({ _id: orderId, packageId, status: 'created', amount: price * 100, priceAtQuote: price, bvAtQuote: pkg.bv, rateAtQuote: RATE, currency: 'INR', createdAt: new Date() });
  if (capture) await webhook('payment.captured', orderId);
  return orderId;
}
async function webhook(event, orderId, { secret = WEBHOOK_SECRET } = {}) {
  const body = JSON.stringify({ event, payload: { payment: { entity: { id: `pay_${rnd()}`, order_id: orderId, error_description: 'card declined' } } } });
  return api('POST', '/api/razorpay/webhook', { headers: { 'x-razorpay-signature': sign(secret, body), 'Content-Type': 'application/json' }, raw: body });
}
async function provision(user, orderId, sponsorCode, extra = {}) {
  return api('POST', '/api/network/provision', { token: user.token, json: { packageId: 'starter', paymentOrderId: orderId, sponsorCode, name: user.email.split('@')[0], phone: '9999999999', ...extra } });
}
const dist = (uid) => db.collection('distributors').findOne({ uid });
const wallet = async (user) => (await api('GET', '/api/wallet', { token: user.token })).body.data;

async function waitForLink(email, fromIndex) {
  for (let i = 0; i < 40; i++) {
    const chunk = serverLog.slice(fromIndex);
    const at = chunk.indexOf(`To: ${email}`);
    if (at >= 0) { const m = chunk.slice(at).match(/oobCode=([0-9a-f]+)/); if (m) return m[1]; }
    await sleep(250);
  }
  return null;
}

// ---------------------------------------------------------------- lifecycle
before(async () => {
  mongo = new MongoClient(uri); await mongo.connect();
  db = mongo.db(TEST_DB);
  await db.dropDatabase();
  await db.collection('bv_rate').insertOne({ rate: RATE, currency: 'INR', isActive: true, effectiveFrom: new Date() });
  await db.collection('settings').insertOne({ _id: 'platform', bvRate: RATE, withdrawalLimit12h: 300, minWithdrawal: 100 });

  const env = {
    ...process.env,
    MONGODB_DB: TEST_DB, SUPER_ADMIN_EMAIL: ADMIN_EMAIL, SUPERADMIN_EMAIL: ADMIN_EMAIL,
    RAZORPAY_WEBHOOK_SECRET: WEBHOOK_SECRET, RAZORPAY_KEY_SECRET: KEY_SECRET, RAZORPAY_KEY_ID: 'rzp_test_it',
    // Disable every external integration:
    Imagekit_PRIVATE_KEY: '', SMTP_USER: '', SMTP_PASS: '', RAZORPAYX_ACCOUNT_NUMBER: '', RAZORPAYX_KEY_ID: '', RAZORPAYX_KEY_SECRET: '',
    APP_URL: BASE,
  };
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--turbopack', '-p', String(PORT)], { env, cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', (d) => (serverLog += d)); server.stderr.on('data', (d) => (serverLog += d));
  const started = Date.now();
  while (!/Ready in/.test(serverLog)) {
    if (server.exitCode !== null) throw new Error(`Next server exited early:\n${serverLog}`);
    if (Date.now() - started > 240_000) throw new Error(`Next server did not start:\n${serverLog}`);
    await sleep(500);
  }
});

after(async () => {
  if (server?.pid) { if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F']); else server.kill('SIGTERM'); }
  try { if (db?.databaseName === TEST_DB) await db.dropDatabase(); } finally { await mongo?.close(); }
});

// Shared fixtures filled in by the suites below (they run in order).
const ctx = {};

// ================================================================ 1. AUTH
describe('IT-AUTH: registration, login, sessions', () => {
  it('IT-AUTH-01 registers a member (role user)', async () => {
    ctx.m1 = await register(`m1-${rnd()}@test.local`, PASSWORD, 'Member One');
    assert.equal(ctx.m1.role, 'user');
  });
  it('IT-AUTH-02 rejects duplicate email', async () => {
    const res = await api('POST', '/api/auth', { json: { mode: 'register', email: ctx.m1.email, password: PASSWORD } });
    assert.equal(res.status, 400); assert.match(res.body.error, /already registered/i);
  });
  it('IT-AUTH-03 rejects password shorter than 6 and missing email', async () => {
    assert.equal((await api('POST', '/api/auth', { json: { mode: 'register', email: `x-${rnd()}@test.local`, password: '123' } })).status, 400);
    assert.equal((await api('POST', '/api/auth', { json: { mode: 'register', email: '', password: PASSWORD } })).status, 400);
  });
  it('IT-AUTH-04 logs in with correct password; rejects wrong password and unknown user', async () => {
    const ok = await login(ctx.m1.email, PASSWORD); assert.equal(ok.status, 200); assert.ok(ok.body.token);
    const bad = await login(ctx.m1.email, 'wrong-password'); assert.equal(bad.status, 400);
    const none = await login('nobody@test.local', PASSWORD); assert.equal(none.status, 400);
    assert.equal(bad.body.error, none.body.error, 'wrong-password and unknown-user must give the same message (no user enumeration)');
  });
  it('IT-AUTH-05 email is case/space insensitive', async () => {
    const res = await login(`  ${ctx.m1.email.toUpperCase()} `, PASSWORD); assert.equal(res.status, 200);
  });
  it('IT-AUTH-06 session endpoint returns the user; no/garbage token is 401', async () => {
    const me = await api('GET', '/api/auth', { token: ctx.m1.token }); assert.equal(me.status, 200); assert.equal(me.body.user.email, ctx.m1.email);
    assert.equal((await api('GET', '/api/auth')).status, 401);
    assert.equal((await api('GET', '/api/auth', { token: 'garbage' })).status, 401);
  });
  it('IT-AUTH-07 password hash is never exposed by auth responses and is stored salted+hashed', async () => {
    const res = await login(ctx.m1.email, PASSWORD); assert.ok(!JSON.stringify(res.body).includes('passwordHash'));
    const user = await db.collection('users').findOne({ email: ctx.m1.email });
    assert.match(user.passwordHash, /^[0-9a-f]{32}:[0-9a-f]{128}$/); assert.ok(!user.passwordHash.includes(PASSWORD));
  });
  it('IT-AUTH-08 logout invalidates the token', async () => {
    const t = (await login(ctx.m1.email, PASSWORD)).body.token;
    assert.equal((await api('DELETE', '/api/auth', { token: t })).status, 200);
    assert.equal((await api('GET', '/api/auth', { token: t })).status, 401);
  });
  it('IT-AUTH-09 expired session is rejected', async () => {
    const t = (await login(ctx.m1.email, PASSWORD)).body.token;
    await db.collection('sessions').updateOne({ token: t }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await api('GET', '/api/auth', { token: t })).status, 401);
  });
  it('IT-AUTH-10 Super Admin email registers as admin; others never get admin', async () => {
    ctx.admin = await register(ADMIN_EMAIL, PASSWORD, 'Super Admin'); assert.equal(ctx.admin.role, 'admin');
    assert.equal(ctx.m1.role, 'user');
  });
  it('IT-AUTH-11 a member cannot self-promote by sending role/mode in the register body', async () => {
    const email = `sneaky-${rnd()}@test.local`;
    const res = await api('POST', '/api/auth', { json: { mode: 'register', email, password: PASSWORD, role: 'admin', rank: 'Admin' } });
    assert.equal(res.body.user.role, 'user');
  });
  it('IT-AUTH-12 profile update changes the display name; requires auth', async () => {
    assert.equal((await api('PATCH', '/api/profile', { json: { displayName: 'X' } })).status, 401);
    assert.equal((await api('PATCH', '/api/profile', { token: ctx.m1.token, json: { displayName: 'Renamed' } })).status, 200);
    assert.equal((await db.collection('users').findOne({ uid: ctx.m1.uid })).name, 'Renamed');
  });
});

// ================================================================ 2. FORGOT PASSWORD
describe('IT-PWD: forgot / reset password', () => {
  before(async () => { ctx.pw = await register(`pw-${rnd()}@test.local`, PASSWORD, 'Pw User'); });
  it('IT-PWD-01 invalid email is a 400', async () => {
    assert.equal((await api('POST', '/api/auth/reset', { json: { email: 'nope' } })).status, 400);
  });
  it('IT-PWD-02 unknown email answers success but sends nothing and stores nothing', async () => {
    const from = serverLog.length; const email = `ghost-${rnd()}@test.local`;
    const res = await api('POST', '/api/auth/reset', { json: { email } }); assert.equal(res.status, 200); assert.equal(res.body.success, true);
    await sleep(800); assert.ok(!serverLog.slice(from).includes(email));
    assert.equal(await db.collection('passwordResets').countDocuments({ email }), 0);
  });
  it('IT-PWD-03 known email gets a reset email; only a hash is stored; TTL index exists', async () => {
    const from = serverLog.length;
    assert.equal((await api('POST', '/api/auth/reset', { json: { email: ctx.pw.email } })).status, 200);
    ctx.pw.code = await waitForLink(ctx.pw.email, from); assert.ok(ctx.pw.code, 'reset link must be emailed');
    const row = await db.collection('passwordResets').findOne({ email: ctx.pw.email });
    assert.ok(row.codeHash && !('code' in row)); assert.notEqual(row.codeHash, ctx.pw.code);
    assert.ok((await db.collection('passwordResets').indexes()).some((i) => i.expireAfterSeconds === 0));
  });
  it('IT-PWD-04 a second request inside the cooldown sends no new email', async () => {
    const from = serverLog.length;
    await api('POST', '/api/auth/reset', { json: { email: ctx.pw.email } }); await sleep(1500);
    assert.ok(!serverLog.slice(from).includes(`To: ${ctx.pw.email}`));
  });
  it('IT-PWD-05 verify endpoint accepts the good code and rejects a bad one', async () => {
    const ok = await api('GET', `/api/auth/reset?code=${ctx.pw.code}`); assert.equal(ok.status, 200); assert.equal(ok.body.email, ctx.pw.email);
    assert.equal((await api('GET', '/api/auth/reset?code=deadbeef')).status, 400);
    assert.equal((await api('GET', '/api/auth/reset')).status, 400);
  });
  it('IT-PWD-06 weak password and missing code are rejected', async () => {
    assert.equal((await api('PATCH', '/api/auth/reset', { json: { code: ctx.pw.code, password: '123' } })).status, 400);
    assert.equal((await api('PATCH', '/api/auth/reset', { json: { password: 'longenough' } })).status, 400);
  });
  it('IT-PWD-07 expired code is rejected', async () => {
    const code = crypto.randomBytes(8).toString('hex');
    await db.collection('passwordResets').insertOne({ codeHash: crypto.createHash('sha256').update(code).digest('hex'), email: ctx.pw.email, createdAt: new Date(Date.now() - 3600e3), expiresAt: new Date(Date.now() - 1000) });
    assert.equal((await api('PATCH', '/api/auth/reset', { json: { code, password: 'NewPass123' } })).status, 400);
  });
  it('IT-PWD-08 reset works end-to-end: new password logs in, old one fails, old sessions are signed out', async () => {
    const before = (await login(ctx.pw.email, PASSWORD)).body.token;
    const res = await api('PATCH', '/api/auth/reset', { json: { code: ctx.pw.code, password: 'NewPass123' } }); assert.equal(res.status, 200);
    assert.equal((await login(ctx.pw.email, 'NewPass123')).status, 200);
    assert.equal((await login(ctx.pw.email, PASSWORD)).status, 400);
    assert.equal((await api('GET', '/api/auth', { token: before })).status, 401);
  });
  it('IT-PWD-09 the link is single-use', async () => {
    assert.equal((await api('PATCH', '/api/auth/reset', { json: { code: ctx.pw.code, password: 'Another123' } })).status, 400);
    assert.equal((await api('GET', `/api/auth/reset?code=${ctx.pw.code}`)).status, 400);
  });
  it('IT-PWD-10 a newer request invalidates the older link', async () => {
    await db.collection('passwordResets').deleteMany({ email: ctx.pw.email }); // clear cooldown
    let from = serverLog.length; await api('POST', '/api/auth/reset', { json: { email: ctx.pw.email } });
    const first = await waitForLink(ctx.pw.email, from);
    await db.collection('passwordResets').updateMany({ email: ctx.pw.email }, { $set: { createdAt: new Date(Date.now() - 120e3) } }); // age past the cooldown
    from = serverLog.length; await api('POST', '/api/auth/reset', { json: { email: ctx.pw.email } });
    const second = await waitForLink(ctx.pw.email, from);
    assert.notEqual(first, second);
    assert.equal((await api('GET', `/api/auth/reset?code=${first}`)).status, 400);
    assert.equal((await api('GET', `/api/auth/reset?code=${second}`)).status, 200);
  });
  it('IT-PWD-11 super admin can use the same flow', async () => {
    const from = serverLog.length;
    assert.equal((await api('POST', '/api/auth/reset', { json: { email: ADMIN_EMAIL } })).status, 200);
    assert.ok(await waitForLink(ADMIN_EMAIL, from));
  });
});

// ================================================================ 3. AUTHORIZATION MATRIX
describe('IT-AUTHZ: protected endpoints reject anonymous and non-admin callers', () => {
  const memberRoutes = [['GET', '/api/wallet'], ['GET', '/api/wallet/transactions'], ['GET', '/api/matching'], ['GET', '/api/wallet/withdraw'], ['POST', '/api/wallet/convert', { bvAmount: 1 }], ['POST', '/api/wallet/withdraw', { amount: 100 }], ['POST', '/api/matching', { leftLotIds: [], rightLotIds: [] }], ['PATCH', '/api/profile', { displayName: 'x' }], ['POST', '/api/network/provision', {}]];
  const adminRoutes = [['GET', '/api/admin/users'], ['GET', '/api/admin/kyc'], ['GET', '/api/admin/withdrawals'], ['GET', '/api/admin/packages'], ['GET', '/api/admin/settings'], ['GET', '/api/admin/company-ledger'], ['GET', '/api/admin/company-overview'], ['GET', '/api/admin/wallet'], ['GET', '/api/admin/wallet-transactions'], ['GET', '/api/admin/company-commissions'], ['POST', '/api/admin/packages', { id: 'hack', name: 'Hack', bv: 1 }], ['PATCH', '/api/admin/packages', { id: 'x', name: 'y' }], ['PATCH', '/api/admin/withdrawals', { id: 'x', status: 'paid' }], ['PATCH', '/api/admin/kyc', { distributorId: 'x', status: 'verified' }], ['PUT', '/api/admin/bv-rate', { rate: 1 }], ['PATCH', '/api/admin/settings', { withdrawalLimit12h: 999999 }], ['POST', '/api/mongo/bootstrap', {}]];
  for (const [method, path, json] of memberRoutes)
    it(`IT-AUTHZ anonymous ${method} ${path} is denied`, async () => denied(await api(method, path, { json })));
  for (const [method, path, json] of adminRoutes) {
    it(`IT-AUTHZ anonymous ${method} ${path} is denied`, async () => denied(await api(method, path, { json })));
    it(`IT-AUTHZ member ${method} ${path} is denied`, async () => denied(await api(method, path, { token: ctx.m1.token, json })));
  }
  it('IT-AUTHZ failed admin attempts changed nothing', async () => {
    assert.equal(await db.collection('packages').countDocuments({ id: 'hack' }), 0);
    assert.notEqual((await db.collection('settings').findOne({ _id: 'platform' })).withdrawalLimit12h, 999999);
  });
});

// ================================================================ 4. CONFIG + PACKAGES
describe('IT-PKG: BV rate, settings, package management', () => {
  it('IT-PKG-01 admin bootstraps indexes', async () => {
    assert.equal((await api('POST', '/api/mongo/bootstrap', { token: ctx.admin.token, json: {} })).status, 200);
  });
  it('IT-PKG-02 public config endpoints respond', async () => {
    const rate = await api('GET', '/api/bv-rate/current'); assert.equal(rate.status, 200); assert.equal(rate.body.data.rate, RATE);
    const settings = await api('GET', '/api/settings'); assert.equal(settings.status, 200); assert.equal(settings.body.data.withdrawalLimit12h, 300);
  });
  it('IT-PKG-03 admin creates a package; price = BV x active rate; validation + duplicates', async () => {
    const res = await api('POST', '/api/admin/packages', { token: ctx.admin.token, json: { id: 'Starter', name: 'Starter Pack', bv: 100, description: 'it' } });
    assert.equal(res.status, 201); assert.equal(res.body.data.id, 'starter'); assert.equal(res.body.data.price, 100 * RATE);
    assert.equal((await api('POST', '/api/admin/packages', { token: ctx.admin.token, json: { id: 'bad', name: 'Bad', bv: 0 } })).status, 400);
    assert.equal((await api('POST', '/api/admin/packages', { token: ctx.admin.token, json: { name: 'NoId', bv: 5 } })).status, 400);
    const dup = await api('POST', '/api/admin/packages', { token: ctx.admin.token, json: { id: 'starter', name: 'Dup', bv: 100 } });
    assert.equal(dup.status, 400); assert.match(dup.body.error, /already exists/i);
  });
  it('IT-PKG-04 public list shows only active packages with computed price', async () => {
    await api('POST', '/api/admin/packages', { token: ctx.admin.token, json: { id: 'extra', name: 'Extra', bv: 50, active: true } });
    let list = (await api('GET', '/api/packages')).body.data; assert.deepEqual(list.map((p) => p.id), ['extra', 'starter']);
    assert.equal(list.find((p) => p.id === 'extra').price, 50 * RATE);
    assert.equal((await api('DELETE', '/api/admin/packages', { token: ctx.admin.token, json: { id: 'extra' } })).status, 200);
    list = (await api('GET', '/api/packages')).body.data; assert.deepEqual(list.map((p) => p.id), ['starter']);
  });
  it('IT-PKG-05 BV of a package cannot be changed once a transaction uses it', async () => {
    await db.collection('packages').insertOne({ id: 'locked', name: 'Locked', bv: 10, active: true });
    await db.collection('transactions').insertOne({ _id: `order_${rnd()}`, packageId: 'locked', status: 'paid' });
    const res = await api('PATCH', '/api/admin/packages', { token: ctx.admin.token, json: { id: 'locked', bv: 99 } });
    assert.equal(res.status, 400); assert.equal((await db.collection('packages').findOne({ id: 'locked' })).bv, 10);
    await db.collection('packages').deleteOne({ id: 'locked' }); await db.collection('transactions').deleteMany({ packageId: 'locked' });
  });
  it('IT-PKG-06 admin can read and tighten platform settings', async () => {
    assert.equal((await api('GET', '/api/admin/settings', { token: ctx.admin.token })).status, 200);
  });
});

// ================================================================ 5. PAYMENTS
describe('IT-PAY: Razorpay webhook and client verification', () => {
  it('IT-PAY-01 webhook rejects missing / wrong / tampered signatures', async () => {
    const orderId = await payOrder('starter', { capture: false });
    const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1', order_id: orderId } } } });
    assert.equal((await api('POST', '/api/razorpay/webhook', { raw: body, headers: { 'Content-Type': 'application/json' } })).status, 400);
    assert.equal((await api('POST', '/api/razorpay/webhook', { raw: body, headers: { 'x-razorpay-signature': sign('wrong', body) } })).status, 400);
    assert.equal((await api('POST', '/api/razorpay/webhook', { raw: body + ' ', headers: { 'x-razorpay-signature': sign(WEBHOOK_SECRET, body) } })).status, 400);
    assert.equal((await db.collection('transactions').findOne({ _id: orderId })).status, 'created');
  });
  it('IT-PAY-02 a signed payment.captured marks the order paid and credits the company ledger once', async () => {
    const orderId = await payOrder('starter', { capture: false });
    const res = await webhook('payment.captured', orderId); assert.equal(res.status, 200);
    const tx = await db.collection('transactions').findOne({ _id: orderId });
    assert.equal(tx.status, 'paid'); assert.equal(tx.priceAtPurchase, 100 * RATE); assert.ok(tx.razorpayPaymentId);
    assert.equal((await webhook('payment.captured', orderId)).body.status, 'already_processed');
    assert.equal(await db.collection('companyLedger').countDocuments({ referenceId: orderId, entryType: 'purchase_revenue' }), 1);
  });
  it('IT-PAY-03 payment.failed marks the order failed', async () => {
    const orderId = await payOrder('starter', { capture: false });
    assert.equal((await webhook('payment.failed', orderId)).status, 200);
    assert.equal((await db.collection('transactions').findOne({ _id: orderId })).status, 'failed');
  });
  it('IT-PAY-04 client verify endpoint validates the signature', async () => {
    const orderId = await payOrder('starter', { capture: false });
    const bad = await api('POST', '/api/razorpay/verify', { json: { razorpay_order_id: orderId, razorpay_payment_id: 'pay_x', razorpay_signature: 'nope' } });
    assert.equal(bad.status, 400); assert.equal((await db.collection('transactions').findOne({ _id: orderId })).status, 'created');
    assert.equal((await api('POST', '/api/razorpay/verify', { json: { razorpay_order_id: orderId } })).status, 400);
    const good = await api('POST', '/api/razorpay/verify', { json: { razorpay_order_id: orderId, razorpay_payment_id: 'pay_ok', razorpay_signature: sign(KEY_SECRET, `${orderId}|pay_ok`) } });
    assert.equal(good.status, 200); assert.equal((await db.collection('transactions').findOne({ _id: orderId })).status, 'paid');
  });
  it('IT-PAY-05 verify for an unknown order is rejected', async () => {
    const o = 'order_unknown';
    assert.equal((await api('POST', '/api/razorpay/verify', { json: { razorpay_order_id: o, razorpay_payment_id: 'p', razorpay_signature: sign(KEY_SECRET, `${o}|p`) } })).status, 400);
  });
});

// ================================================================ 6. NETWORK PROVISIONING + BINARY TREE
describe('IT-NET: admin provisioning, member enrollment, binary placement, commissions', () => {
  it('IT-NET-01 a non-super-admin cannot claim admin registration', async () => {
    const res = await api('POST', '/api/network/provision', { token: ctx.m1.token, json: { registrationType: 'admin' } });
    denied(res); assert.equal(await dist(ctx.m1.uid), null);
  });
  it('IT-NET-02 Super Admin is provisioned as the root with two referral codes; repeat call is idempotent', async () => {
    const res = await api('POST', '/api/network/provision', { token: ctx.admin.token, json: { registrationType: 'admin', name: 'Super Admin' } });
    assert.equal(res.status, 200); ctx.adminLeft = res.body.leftReferralCode; ctx.adminRight = res.body.rightReferralCode;
    assert.match(ctx.adminLeft, /^SJAPL-L-/); assert.match(ctx.adminRight, /^SJAPL-R-/);
    const d = await dist(ctx.admin.uid); assert.equal(d.rank, 'Admin'); assert.equal(d.kycStatus, 'verified');
    const again = await api('POST', '/api/network/provision', { token: ctx.admin.token, json: { registrationType: 'admin' } });
    assert.equal(again.body.alreadyProvisioned, true); assert.equal(again.body.leftReferralCode, ctx.adminLeft);
    assert.equal(await db.collection('distributors').countDocuments({ uid: ctx.admin.uid }), 1);
  });
  it('IT-NET-03 enrollment needs a verified payment', async () => {
    const none = await provision(ctx.m1, '', ctx.adminLeft); assert.equal(none.status, 400);
    const unpaid = await payOrder('starter', { capture: false });
    const res = await provision(ctx.m1, unpaid, ctx.adminLeft); assert.equal(res.status, 400); assert.match(res.body.error, /not been verified/i);
    assert.equal(await dist(ctx.m1.uid), null);
  });
  it('IT-NET-04 enrollment needs a valid package and a matching payment', async () => {
    const paid = await payOrder('starter');
    assert.equal((await provision(ctx.m1, paid, ctx.adminLeft, { packageId: 'does-not-exist' })).status, 400);
    await db.collection('packages').insertOne({ id: 'other', name: 'Other', bv: 10, active: true });
    const res = await provision(ctx.m1, paid, ctx.adminLeft, { packageId: 'other' }); assert.equal(res.status, 400); assert.match(res.body.error, /match/i);
    ctx.paidSpare = paid;
  });
  it('IT-NET-05 enrollment needs a valid referral code', async () => {
    const res = await provision(ctx.m1, ctx.paidSpare, 'SJAPL-L-NOPE'); assert.equal(res.status, 400); assert.match(res.body.error, /referral code/i);
    assert.equal((await provision(ctx.m1, ctx.paidSpare, '')).status, 400);
  });
  it('IT-NET-06 member 1 joins under the admin LEFT code: placement, upline counts, 10% direct commission, ledger rows', async () => {
    const res = await provision(ctx.m1, ctx.paidSpare, ctx.adminLeft); assert.equal(res.status, 200, JSON.stringify(res.body));
    ctx.m1.left = res.body.leftReferralCode; ctx.m1.right = res.body.rightReferralCode;
    const m = await dist(ctx.m1.uid); assert.equal(m.parentId, ctx.admin.uid); assert.equal(m.sponsorId, ctx.admin.uid); assert.equal(m.position, 'left'); assert.equal(m.bvBalance, 100); assert.equal(m.kycStatus, 'none');
    const a = await dist(ctx.admin.uid); assert.equal(a.leftChildId, ctx.m1.uid); assert.equal(a.leftCount, 1); assert.equal(a.leftBV, 100); assert.equal(a.commissionBvBalance, 10);
    const c = await db.collection('commissions').findOne({ beneficiaryId: ctx.admin.uid, commissionType: 'direct_sponsor' });
    assert.equal(c.bv, 10); assert.equal(c.commissionAmount, 10 * RATE);
    assert.equal(await db.collection('companyLedger').countDocuments({ entryType: 'commission_payout' }), 1);
  });
  it('IT-NET-07 the same user / payment cannot enroll twice', async () => {
    const again = await provision(ctx.m1, ctx.paidSpare, ctx.adminLeft); assert.equal(again.body.alreadyProvisioned, true);
    assert.equal(await db.collection('distributors').countDocuments({ uid: ctx.m1.uid }), 1);
    assert.equal(await db.collection('commissions').countDocuments({ beneficiaryId: ctx.admin.uid, commissionType: 'direct_sponsor' }), 1, 'no duplicate commission');
  });
  it('IT-NET-08 a payment already linked to another account is rejected', async () => {
    const intruder = await register(`intruder-${rnd()}@test.local`);
    const res = await provision(intruder, ctx.paidSpare, ctx.adminRight); assert.equal(res.status, 400); assert.match(res.body.error, /linked/i);
    assert.equal(await dist(intruder.uid), null);
  });
  it('IT-NET-09 a sponsor without verified KYC cannot refer', async () => {
    ctx.m2 = await register(`m2-${rnd()}@test.local`, PASSWORD, 'Member Two');
    const res = await provision(ctx.m2, await payOrder('starter'), ctx.m1.left); assert.equal(res.status, 400); assert.match(res.body.error, /KYC/i);
    assert.equal(await dist(ctx.m2.uid), null);
  });
  it('IT-NET-10 KYC: member submit without files fails; with a file but ImageKit unconfigured fails safely', async () => {
    assert.equal((await api('POST', '/api/kyc', { token: ctx.m1.token, form: new FormData() })).status, 400);
    const form = new FormData(); form.append('idProof', new Blob(['x'], { type: 'image/png' }), 'id.png');
    const res = await api('POST', '/api/kyc', { token: ctx.m1.token, form }); assert.equal(res.status, 400); assert.match(res.body.error, /ImageKit/i);
    assert.equal((await api('POST', '/api/kyc', { form: new FormData() })).status, 401);
  });
  it('IT-NET-11 KYC review: admin verifies member 1 (validation + effect)', async () => {
    await db.collection('kycSubmissions').insertOne({ id: `KYC_${ctx.m1.uid}`, distributorId: ctx.m1.uid, status: 'pending', submittedAt: new Date() });
    await db.collection('distributors').updateOne({ uid: ctx.m1.uid }, { $set: { kycStatus: 'pending' } });
    assert.equal((await api('PATCH', '/api/admin/kyc', { token: ctx.admin.token, json: { distributorId: ctx.m1.uid, status: 'maybe' } })).status, 400);
    assert.equal((await api('PATCH', '/api/admin/kyc', { token: ctx.admin.token, json: { distributorId: 'nobody', status: 'verified' } })).status, 400);
    assert.equal((await api('PATCH', '/api/admin/kyc', { token: ctx.admin.token, json: { distributorId: ctx.m1.uid, status: 'rejected', rejectionReason: 'blurry' } })).status, 200);
    assert.equal((await dist(ctx.m1.uid)).kycStatus, 'rejected');
    assert.equal((await api('PATCH', '/api/admin/kyc', { token: ctx.admin.token, json: { distributorId: ctx.m1.uid, status: 'verified' } })).status, 200);
    assert.equal((await dist(ctx.m1.uid)).kycStatus, 'verified');
    const list = await api('GET', '/api/admin/kyc', { token: ctx.admin.token }); assert.equal(list.status, 200); assert.ok(!JSON.stringify(list.body).includes('passwordHash'));
  });
  it('IT-NET-12 member 2 joins under member 1 (now KYC-verified): placed on m1 left; sponsor m1 earns 10 BV; upline BV rolls up', async () => {
    const res = await provision(ctx.m2, await payOrder('starter'), ctx.m1.left); assert.equal(res.status, 200, JSON.stringify(res.body));
    const m2 = await dist(ctx.m2.uid); assert.equal(m2.parentId, ctx.m1.uid); assert.equal(m2.sponsorId, ctx.m1.uid);
    assert.equal((await dist(ctx.m1.uid)).commissionBvBalance, 10);
    const a = await dist(ctx.admin.uid); assert.equal(a.leftCount, 2); assert.equal(a.leftBV, 200, 'admin sees m2 through the left leg');
  });
  it('IT-NET-13 outer-leg spillover: another member on the admin LEFT code lands under m2', async () => {
    ctx.m3 = await register(`m3-${rnd()}@test.local`, PASSWORD, 'Member Three');
    const res = await provision(ctx.m3, await payOrder('starter'), ctx.adminLeft); assert.equal(res.status, 200, JSON.stringify(res.body));
    const m3 = await dist(ctx.m3.uid); assert.equal(m3.parentId, ctx.m2.uid); assert.equal(m3.sponsorId, ctx.admin.uid); assert.equal(m3.position, 'left');
    assert.equal(await db.collection('distributors').countDocuments({ leftChildId: ctx.m3.uid }), 1);
  });
  it('IT-NET-14 admin RIGHT code fills the right leg', async () => {
    ctx.m4 = await register(`m4-${rnd()}@test.local`, PASSWORD, 'Member Four');
    const res = await provision(ctx.m4, await payOrder('starter'), ctx.adminRight); assert.equal(res.status, 200, JSON.stringify(res.body));
    const a = await dist(ctx.admin.uid); assert.equal(a.rightChildId, ctx.m4.uid); assert.equal(a.rightCount, 1); assert.equal(a.rightBV, 100); assert.equal(a.leftCount, 3); assert.equal(a.leftBV, 300);
    assert.equal(a.commissionBvBalance, 30, '3 direct sponsorships x 10 BV');
  });
  it('IT-NET-15 tree integrity: no node has two parents, counts match descendants', async () => {
    const all = await db.collection('distributors').find({}).toArray(); const byId = new Map(all.map((d) => [d.uid, d]));
    const parents = new Map();
    for (const d of all) for (const side of ['leftChildId', 'rightChildId']) if (d[side]) { assert.ok(!parents.has(d[side]), 'child with two parents'); parents.set(d[side], d.uid); assert.equal(byId.get(d[side]).parentId, d.uid); }
    const count = (id) => (id ? 1 + count(byId.get(id).leftChildId) + count(byId.get(id).rightChildId) : 0);
    for (const d of all) { assert.equal(d.leftCount, count(d.leftChildId), `${d.email} leftCount`); assert.equal(d.rightCount, count(d.rightChildId), `${d.email} rightCount`); }
  });
  it('IT-NET-16 concurrent enrollments on the same slot never double-book it', async () => {
    const users = await Promise.all([1, 2, 3, 4].map((n) => register(`race${n}-${rnd()}@test.local`)));
    const orders = await Promise.all(users.map(() => payOrder('starter')));
    const results = await Promise.all(users.map((u, i) => provision(u, orders[i], ctx.adminRight)));
    for (const r of results) assert.equal(r.status, 200, JSON.stringify(r.body));
    const all = await db.collection('distributors').find({}).toArray(); const seen = new Set();
    for (const d of all) for (const side of ['leftChildId', 'rightChildId']) if (d[side]) { assert.ok(!seen.has(d[side]), 'slot double-booked'); seen.add(d[side]); }
    ctx.race = users;
  });
});

// ================================================================ 7. MATCHING
describe('IT-MATCH: matching commission lots', () => {
  it('IT-MATCH-01 lots exist only for the placement parent and are readable by the owner', async () => {
    const res = await api('GET', '/api/matching', { token: ctx.admin.token }); assert.equal(res.status, 200);
    ctx.lots = res.body.data; assert.ok(ctx.lots.leftLots.length >= 1 && ctx.lots.rightLots.length >= 1);
    const other = await api('GET', '/api/matching', { token: ctx.m3.token }); assert.equal(other.body.data.leftLots.length + other.body.data.rightLots.length, 0);
  });
  it('IT-MATCH-02 invalid selections are rejected', async () => {
    const t = ctx.admin.token;
    assert.equal((await api('POST', '/api/matching', { token: t, json: { leftLotIds: [], rightLotIds: [] } })).status, 400);
    assert.equal((await api('POST', '/api/matching', { token: t, json: { leftLotIds: ['x'], rightLotIds: ['y'] } })).status, 400);
    assert.equal((await api('POST', '/api/matching', { token: t, json: { leftLotIds: [ctx.lots.leftLots[0]._id], rightLotIds: [ctx.lots.leftLots[0]._id] } })).status, 400);
  });
  it("IT-MATCH-03 a member cannot match someone else's lots", async () => {
    const res = await api('POST', '/api/matching', { token: ctx.m3.token, json: { leftLotIds: [ctx.lots.leftLots[0]._id], rightLotIds: [ctx.lots.rightLots[0]._id] } });
    assert.equal(res.status, 400);
  });
  it('IT-MATCH-04 equal-BV left+right lots produce a 15% matching commission and are consumed', async () => {
    const before = (await dist(ctx.admin.uid)).commissionBvBalance;
    const left = ctx.lots.leftLots[0], right = ctx.lots.rightLots[0];
    const res = await api('POST', '/api/matching', { token: ctx.admin.token, json: { leftLotIds: [left._id], rightLotIds: [right._id] } });
    assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal((await dist(ctx.admin.uid)).commissionBvBalance, before + (left.bvAmount + right.bvAmount) * 0.15);
    assert.equal((await db.collection('matchingLots').findOne({ _id: new (await import('mongodb')).ObjectId(left._id) })).status, 'consumed');
    ctx.matched = { left: left._id, right: right._id };
  });
  it('IT-MATCH-05 the same lots cannot be matched twice', async () => {
    const res = await api('POST', '/api/matching', { token: ctx.admin.token, json: { leftLotIds: [ctx.matched.left], rightLotIds: [ctx.matched.right] } });
    assert.equal(res.status, 400);
    assert.equal(await db.collection('commissions').countDocuments({ commissionType: 'matching', beneficiaryId: ctx.admin.uid }), 1);
  });
});

// ================================================================ 8. WALLET + WITHDRAWALS
describe('IT-WAL: wallet, BV conversion, withdrawals, limits, admin payout actions', () => {
  it('IT-WAL-01 wallet summary reflects balances', async () => {
    const w = await wallet(ctx.admin);
    const credited = (await db.collection('commissions').find({ beneficiaryId: ctx.admin.uid, status: 'credited' }).toArray()).reduce((s, c) => s + c.bvAmount, 0);
    assert.ok(credited > 0); assert.equal(w.commissionBvBalance, credited, 'wallet commission BV must equal the sum of credited commissions');
    assert.equal(w.convertedIncentiveBalance, 0); ctx.adminBv = w.commissionBvBalance;
    assert.ok(Array.isArray((await api('GET', '/api/wallet/transactions', { token: ctx.admin.token })).body.data ?? []));
  });
  it('IT-WAL-02 conversion rejects invalid / excessive amounts', async () => {
    for (const bvAmount of [0, -5, 'abc', null]) assert.equal((await api('POST', '/api/wallet/convert', { token: ctx.admin.token, json: { bvAmount } })).status, 400);
    const res = await api('POST', '/api/wallet/convert', { token: ctx.admin.token, json: { bvAmount: ctx.adminBv + 1 } }); assert.equal(res.status, 400); assert.match(res.body.error, /Insufficient/i);
  });
  it('IT-WAL-03 purchased BV is not convertible: a member with only purchased BV cannot convert', async () => {
    const res = await api('POST', '/api/wallet/convert', { token: ctx.m3.token, json: { bvAmount: 10 } }); assert.equal(res.status, 400);
  });
  it('IT-WAL-04 converting commission BV moves value to withdrawable INR at the platform rate (atomic ledger rows)', async () => {
    const res = await api('POST', '/api/wallet/convert', { token: ctx.admin.token, json: { bvAmount: 40 } });
    assert.equal(res.status, 200, JSON.stringify(res.body)); assert.equal(res.body.rupeeAmount, 40 * RATE);
    const w = await wallet(ctx.admin); assert.equal(w.commissionBvBalance, ctx.adminBv - 40); assert.equal(w.convertedIncentiveBalance, 800);
    assert.equal(await db.collection('conversions').countDocuments({ userId: ctx.admin.uid }), 1);
  });
  it('IT-WAL-05 withdrawal validation: amount, UPI, minimum', async () => {
    const t = ctx.admin.token, upi = { upi: 'admin@okbank' };
    for (const amount of [0, -100, 'abc', 100.123]) assert.equal((await api('POST', '/api/wallet/withdraw', { token: t, json: { amount, accountDetails: upi } })).status, 400, `amount ${amount}`);
    assert.equal((await api('POST', '/api/wallet/withdraw', { token: t, json: { amount: 150, accountDetails: { upi: 'not-a-upi' } } })).status, 400);
    const min = await api('POST', '/api/wallet/withdraw', { token: t, json: { amount: 50, accountDetails: upi } }); assert.equal(min.status, 400); assert.match(min.body.error, /minimum/i);
    assert.equal((await wallet(ctx.admin)).convertedIncentiveBalance, 800, 'rejected requests must not debit');
  });
  it('IT-WAL-06 a valid withdrawal debits the wallet and is queued as pending (manual payout mode)', async () => {
    const res = await api('POST', '/api/wallet/withdraw', { token: ctx.admin.token, json: { amount: 120, accountDetails: { upi: 'admin@okbank' } } });
    assert.equal(res.status, 201, JSON.stringify(res.body)); assert.equal(res.body.data.status, 'pending'); ctx.w1 = String(res.body.data._id);
    assert.equal((await wallet(ctx.admin)).convertedIncentiveBalance, 680);
    const list = await api('GET', '/api/wallet/withdraw', { token: ctx.admin.token }); assert.equal(list.body.limits.used, 120); assert.equal(list.body.limits.remaining, 180);
  });
  it('IT-WAL-07 the 12-hour cap is enforced (cap 300: 120 used, +200 refused, +180 allowed, then blocked)', async () => {
    const t = ctx.admin.token, upi = { upi: 'admin@okbank' };
    const over = await api('POST', '/api/wallet/withdraw', { token: t, json: { amount: 200, accountDetails: upi } }); assert.equal(over.status, 400); assert.equal(over.body.remaining, 180);
    assert.equal((await wallet(ctx.admin)).convertedIncentiveBalance, 680, 'refused withdrawal must roll back its debit');
    const ok = await api('POST', '/api/wallet/withdraw', { token: t, json: { amount: 180, accountDetails: upi } }); assert.equal(ok.status, 201); ctx.w2 = String(ok.body.data._id);
    const blocked = await api('POST', '/api/wallet/withdraw', { token: t, json: { amount: 100, accountDetails: upi } }); assert.equal(blocked.status, 400); assert.match(blocked.body.error, /limit/i);
  });
  it('IT-WAL-08 a member without verified KYC cannot withdraw', async () => {
    const res = await api('POST', '/api/wallet/withdraw', { token: ctx.m3.token, json: { amount: 100, accountDetails: { upi: 'm3@okbank' } } }); assert.equal(res.status, 400); assert.match(res.body.error, /KYC/i);
  });
  it('IT-WAL-09 admin payout actions: approve then mark paid; reject refunds; illegal transitions refused', async () => {
    const t = ctx.admin.token;
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: ctx.w1, status: 'approved' } })).status, 200);
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: ctx.w1, status: 'approved' } })).status, 400, 'cannot approve twice');
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: ctx.w1, status: 'paid' } })).status, 200);
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: ctx.w1, status: 'rejected' } })).status, 400, 'paid cannot be rejected');
    const before = (await wallet(ctx.admin)).convertedIncentiveBalance;
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: ctx.w2, status: 'rejected' } })).status, 200);
    assert.equal((await wallet(ctx.admin)).convertedIncentiveBalance, before + 180, 'rejection refunds the wallet');
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: ctx.w2, status: 'rejected' } })).status, 400, 'no double refund');
    assert.equal((await wallet(ctx.admin)).convertedIncentiveBalance, before + 180);
    assert.equal((await api('PATCH', '/api/admin/withdrawals', { token: t, json: { id: 'zzz', status: 'bogus' } })).status, 400);
    const all = await api('GET', '/api/admin/withdrawals', { token: t }); assert.equal(all.status, 200); assert.ok(all.body.data.length >= 2);
  });
  it('IT-WAL-10 double-spend: two simultaneous withdrawals of more than half the balance -> exactly one succeeds', async () => {
    // Fresh KYC-verified member with exactly 200 withdrawable.
    const racer = ctx.race[0];
    await db.collection('distributors').updateOne({ uid: racer.uid }, { $set: { kycStatus: 'verified', convertedIncentiveBalance: 200 } });
    const body = { amount: 150, accountDetails: { upi: 'racer@okbank' } };
    const results = await Promise.all([api('POST', '/api/wallet/withdraw', { token: racer.token, json: body }), api('POST', '/api/wallet/withdraw', { token: racer.token, json: body })]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 400], JSON.stringify(results.map((r) => r.body)));
    assert.equal((await dist(racer.uid)).convertedIncentiveBalance, 50);
    assert.equal(await db.collection('withdrawals').countDocuments({ userId: racer.uid }), 1);
  });
  it('IT-WAL-11 double-convert: two simultaneous conversions of the full commission balance -> exactly one succeeds', async () => {
    const racer = ctx.race[1];
    await db.collection('distributors').updateOne({ uid: racer.uid }, { $set: { commissionBvBalance: 10 } });
    const call = () => api('POST', '/api/wallet/convert', { token: racer.token, json: { bvAmount: 10 } });
    const results = await Promise.all([call(), call()]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400]);
    const d = await dist(racer.uid); assert.equal(d.commissionBvBalance, 0); assert.equal(d.convertedIncentiveBalance, 10 * RATE);
  });
  it('IT-WAL-12 users can only read their own wallet detail', async () => {
    assert.equal((await api('GET', `/api/wallet/${ctx.m3.uid}`, { token: ctx.m3.token })).status, 200);
    denied(await api('GET', `/api/wallet/${ctx.admin.uid}`, { token: ctx.m3.token }));
    denied(await api('GET', `/api/wallet/${ctx.admin.uid}/transactions`, { token: ctx.m3.token }));
    denied(await api('GET', `/api/wallet/${ctx.admin.uid}/commissions`, { token: ctx.m3.token }));
  });
});

// ================================================================ 9. ADMIN REPORTING
describe('IT-ADM: admin dashboards and company ledger', () => {
  it('IT-ADM-01 admin read endpoints all respond 200 with data and never leak password hashes', async () => {
    for (const path of ['/api/admin/users', '/api/admin/kyc', '/api/admin/withdrawals', '/api/admin/packages', '/api/admin/settings', '/api/admin/company-ledger', '/api/admin/company-overview', '/api/admin/wallet', '/api/admin/wallet-transactions', '/api/admin/company-commissions']) {
      const res = await api('GET', path, { token: ctx.admin.token }); assert.equal(res.status, 200, `${path} -> ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`);
      assert.ok(!JSON.stringify(res.body).includes('passwordHash'), `${path} leaks passwordHash`);
    }
  });
  it('IT-ADM-02 company ledger reconciles: revenue credits = paid purchases, payouts = credited commissions', async () => {
    const rows = await db.collection('companyLedger').find({}).toArray();
    const credit = rows.filter((r) => r.entryType === 'purchase_revenue').reduce((s, r) => s + r.amount, 0);
    const paid = (await db.collection('transactions').find({ status: 'paid', _id: { $in: rows.filter((r) => r.entryType === 'purchase_revenue').map((r) => r.referenceId) } }).toArray()).reduce((s, t) => s + t.priceAtPurchase, 0);
    assert.equal(credit, paid);
    const debit = rows.filter((r) => r.entryType === 'commission_payout').reduce((s, r) => s + r.amount, 0);
    const commissions = (await db.collection('commissions').find({ status: 'credited' }).toArray()).reduce((s, c) => s + c.commissionAmount, 0);
    assert.equal(debit, commissions);
  });
  it('IT-ADM-03 admin changes the BV rate; new packages price at the new rate; existing paid orders keep the old price', async () => {
    const old = await db.collection('transactions').findOne({ status: 'paid' });
    const res = await api('PUT', '/api/admin/bv-rate', { token: ctx.admin.token, json: { rate: RATE + 5 } }); assert.equal(res.status, 200, JSON.stringify(res.body));
    assert.equal((await api('GET', '/api/packages')).body.data.find((p) => p.id === 'starter').price, 100 * (RATE + 5));
    assert.equal((await db.collection('transactions').findOne({ _id: old._id })).priceAtPurchase, old.priceAtPurchase);
    assert.equal(await db.collection('bv_rate').countDocuments({ isActive: true }), 1, 'exactly one active rate');
    await api('PUT', '/api/admin/bv-rate', { token: ctx.admin.token, json: { rate: RATE } });
  });
  it('IT-ADM-04 BV rate validation', async () => {
    for (const rate of [0, -1, 'abc']) assert.equal((await api('PUT', '/api/admin/bv-rate', { token: ctx.admin.token, json: { rate } })).status, 400);
  });
});

// ================================================================ 10. GENERIC DATA API HARDENING
describe('IT-SEC: generic /api/data/* endpoint hardening', () => {
  before(async () => { ctx.evil = await register(`evil-${rnd()}@test.local`, PASSWORD, 'Evil'); });
  it('IT-SEC-01 anonymous cannot read private collections', async () => {
    for (const c of ['users', 'distributors', 'transactions', 'kycSubmissions']) denied(await api('GET', `/api/data/${c}`));
    assert.equal((await api('GET', '/api/data/secret_collection', { token: ctx.evil.token })).status, 404);
  });
  it("IT-SEC-02 a member cannot read another user's account record (no password hash, no foreign data)", async () => {
    const res = await api('GET', `/api/data/users?uid=${ctx.admin.uid}`, { token: ctx.evil.token });
    const text = JSON.stringify(res.body);
    assert.ok(!text.includes('passwordHash'), 'password hash leaked to another user');
    assert.ok(!text.includes(ADMIN_EMAIL), "another user's account data leaked");
  });
  it('IT-SEC-03 a member cannot forge referral codes', async () => {
    const res = await api('POST', '/api/data/referralCodes', { token: ctx.evil.token, json: { code: 'FORGED', ownerId: ctx.admin.uid, position: 'left' } });
    denied(res); assert.equal(await db.collection('referralCodes').countDocuments({ code: 'FORGED' }), 0, 'forged referral code was inserted');
  });
  it('IT-SEC-04 a member cannot insert/modify user records or escalate to admin', async () => {
    const res = await api('POST', '/api/data/users', { token: ctx.evil.token, json: { uid: ctx.evil.uid, email: ctx.evil.email, role: 'admin' } });
    denied(res);
    assert.equal(await db.collection('users').countDocuments({ uid: ctx.evil.uid }), 1, 'duplicate user record inserted');
    denied(await api('GET', '/api/admin/users', { token: ctx.evil.token }));
    denied(await api('PATCH', '/api/data/users', { token: ctx.evil.token, json: { id: ctx.evil.uid, role: 'admin' } }));
  });
  it('IT-SEC-05 a member cannot create transactions that look paid, packages, or distributors', async () => {
    const tx = await api('POST', '/api/data/transactions', { token: ctx.evil.token, json: { _id: 'order_fake', status: 'paid', packageId: 'starter', amount: 1 } });
    denied(tx); assert.equal(await db.collection('transactions').countDocuments({ _id: 'order_fake' }), 0, 'a member inserted a "paid" transaction');
    denied(await api('POST', '/api/data/packages', { token: ctx.evil.token, json: { id: 'free', name: 'Free', bv: 1, active: true } }));
    denied(await api('POST', '/api/data/distributors', { token: ctx.evil.token, json: { uid: ctx.evil.uid, rank: 'Admin' } }));
  });
  it('IT-SEC-06 a member cannot update or delete data', async () => {
    denied(await api('PATCH', '/api/data/distributors', { token: ctx.evil.token, json: { id: ctx.m3.uid, bvBalance: 999999 } }));
    denied(await api('DELETE', `/api/data/users?id=${ctx.m3.uid}`, { token: ctx.evil.token }));
    assert.ok(await db.collection('users').findOne({ uid: ctx.m3.uid }));
  });
  it('IT-SEC-07 listing all distributors / transactions needs admin', async () => {
    denied(await api('GET', '/api/data/distributors', { token: ctx.evil.token })); denied(await api('GET', '/api/data/transactions', { token: ctx.evil.token }));
  });
  it('IT-SEC-09 EXPLOIT: a member cannot enroll for free with a self-made "paid" transaction', async () => {
    const thief = await register(`thief-${rnd()}@test.local`);
    const fakeId = `order_free_${rnd()}`;
    await api('POST', '/api/data/transactions', { token: thief.token, json: { _id: fakeId, status: 'paid', packageId: 'starter', amount: 100, priceAtQuote: 1 } });
    const before = (await dist(ctx.admin.uid)).commissionBvBalance;
    const res = await provision(thief, fakeId, ctx.adminRight);
    assert.notEqual(res.status, 200, `free enrollment succeeded: ${JSON.stringify(res.body)}`);
    assert.equal(await dist(thief.uid), null, 'thief was placed in the tree without paying');
    assert.equal((await dist(ctx.admin.uid)).commissionBvBalance, before, 'sponsor was credited commission for a payment that never happened');
  });
  it('IT-SEC-10 EXPLOIT: inserting a user record with role admin must not grant admin APIs', async () => {
    const climber = await register(`climber-${rnd()}@test.local`);
    await api('POST', '/api/data/users', { token: climber.token, json: { uid: climber.uid, email: climber.email, role: 'admin' } });
    denied(await api('GET', '/api/admin/users', { token: climber.token }));
    denied(await api('GET', '/api/admin/withdrawals', { token: climber.token }));
  });
  it('IT-SEC-08 public referral lookup requires a code', async () => {
    assert.equal((await api('GET', '/api/data/referralCodes')).status, 400);
    assert.equal((await api('GET', `/api/data/referralCodes?code=${ctx.adminLeft}`)).status, 200);
  });
});

// ================================================================ 11. PUBLIC STOREFRONT
describe('IT-STORE: public website, order enquiries and contact form', () => {
  const ip = (n) => ({ 'X-Forwarded-For': `10.20.30.${n}` });
  const buyer = (phone, over = {}) => ({ name: 'Test Buyer', phone, email: '', address: '12 Test Street, Sample Nagar', city: 'Pune', pincode: '411001', notes: '', ...over });
  const enquiry = (items, extra = {}, headers = ip(1)) => api('POST', '/api/orders/enquiry', { headers, json: { items, customer: buyer('9876500001'), ...extra } });

  before(async () => {
    const base = { category: 'Herbal Wellness', description: 'Test product', benefits: [], images: [], createdAt: new Date() };
    await db.collection('products').insertMany([
      { ...base, id: 'it-w', slug: 'it-widget', name: 'IT Widget', sku: 'IT-W', price: 500, mrp: 700, stock: 3, status: 'active', isFeatured: true, bvValue: 120, maxOrderQty: 2, subtitle: 'Test subtitle', ingredients: [{ name: 'Tulsi Leaf', botanicalName: 'Ocimum sanctum' }], faqs: [{ question: 'Is it tested?', answer: 'Yes, in CI.' }], howToUse: { dosage: '5 drops daily', steps: ['Add drops', 'Stir'] }, seo: { metaTitle: 'IT Widget Custom Title', metaDescription: 'Custom meta' } },
      { ...base, id: 'it-i', slug: 'it-hidden', name: 'IT Hidden', sku: 'IT-I', price: 100, stock: 10, status: 'inactive' },
      { ...base, id: 'it-z', slug: 'it-unpriced', name: 'IT Unpriced', sku: 'IT-Z', price: 0, stock: 10, status: 'active' },
      { ...base, id: 'it-o', slug: 'it-soldout', name: 'IT Sold Out', sku: 'IT-O', price: 250, stock: 0, status: 'active' },
    ]);
    const find = async (slug) => (await db.collection('products').findOne({ slug }))._id.toString();
    ctx.pid = { widget: await find('it-widget'), hidden: await find('it-hidden'), unpriced: await find('it-unpriced'), soldout: await find('it-soldout') };
  });

  for (const path of ['/', '/shop', '/about', '/services', '/blog', '/blog/how-to-take-special-15', '/contact', '/faq', '/privacy', '/terms', '/refund-policy', '/shipping-policy', '/disclaimer', '/cart', '/order-received?ref=ENQ-TEST', '/products/it-widget'])
    it(`IT-STORE page ${path} renders`, async () => {
      const res = await api('GET', path);
      assert.equal(res.status, 200);
      assert.ok(String(res.body).includes('<html'));
    });

  it('IT-STORE-01 unknown pages and products return 404', async () => {
    assert.equal((await api('GET', '/no-such-page')).status, 404);
    assert.equal((await api('GET', '/products/no-such-product')).status, 404);
  });
  it('IT-STORE-02 only active, priced products are public (shop, product page, sitemap)', async () => {
    const shop = String((await api('GET', '/shop')).body);
    // Match the rendered product-card links: dev-mode React debug payloads can echo raw data elsewhere in the HTML.
    const card = (slug) => `href="/products/${slug}"`;
    assert.ok(shop.includes(card('it-widget')), 'shop is missing the active product');
    assert.ok(shop.includes(card('it-soldout')), 'shop is missing the sold-out product');
    assert.ok(!shop.includes(card('it-hidden')), 'shop shows an inactive product');
    assert.ok(!shop.includes(card('it-unpriced')), 'shop shows an unpriced product');
    assert.equal((await api('GET', '/products/it-hidden')).status, 404);
    assert.equal((await api('GET', '/products/it-unpriced')).status, 404);
    const sitemap = String((await api('GET', '/sitemap.xml')).body);
    assert.ok(sitemap.includes('/products/it-widget') && !sitemap.includes('it-hidden'));
  });
  it('IT-STORE-03 shop search and category filter work', async () => {
    const card = 'href="/products/it-widget"';
    assert.ok(String((await api('GET', '/shop?q=widget')).body).includes(card), 'q=widget should find the product');
    const none = String((await api('GET', '/shop?q=zzzznotfound')).body);
    assert.ok(!none.includes(card), 'q=zzzznotfound should hide the product');
    assert.ok(none.includes('Nothing matches that search'), 'an empty search should say so');
    assert.ok(String((await api('GET', '/shop?category=Herbal%20Wellness&sort=price-asc')).body).includes(card), 'category filter should find the product');
  });
  it('IT-STORE-04 product page ships SEO data and no fake ratings', async () => {
    const html = String((await api('GET', '/products/it-widget')).body);
    assert.ok(html.includes('application/ld+json') && html.includes('"priceCurrency":"INR"'));
    assert.ok(!/aggregateRating|ratingValue/.test(html));
  });
  it('IT-STORE-05 robots.txt hides private areas and points to the sitemap', async () => {
    const robots = String((await api('GET', '/robots.txt')).body);
    assert.ok(robots.includes('Disallow: /dashboard') && robots.includes('Disallow: /api/') && robots.includes('sitemap.xml'));
  });

  it('IT-STORE-06 BV is highlighted under the price on shop cards and the product page (hidden when 0)', async () => {
    const shop = String((await api('GET', '/shop')).body);
    assert.ok(/120 BV/.test(shop), 'shop card shows BV');
    const page = String((await api('GET', '/products/it-widget')).body);
    assert.ok(/120 BV/.test(page), 'product page shows BV');
    assert.ok(!/0 BV per unit/.test(String((await api('GET', '/products/it-soldout')).body)), 'no BV badge when bvValue is 0');
  });
  it('IT-STORE-07 product page shows the full catalogue details and FAQ structured data', async () => {
    const html = String((await api('GET', '/products/it-widget')).body);
    assert.ok(html.includes('Tulsi Leaf') && html.includes('Ocimum sanctum'), 'ingredients table');
    assert.ok(html.includes('Is it tested?') && html.includes('FAQPage'), 'FAQ + JSON-LD');
    assert.ok(html.includes('5 drops daily') && html.includes('Test subtitle'));
    assert.ok(html.includes('IT Widget Custom Title'), 'SEO title');
    assert.ok(html.includes('Shri Amrit Herbals'), 'manufacturer line');
  });

  it('IT-STORE-10 enquiry validation', async () => {
    assert.equal((await enquiry([])).status, 400);
    assert.equal((await enquiry([{ id: ctx.pid.widget, qty: 0 }])).status, 400);
    assert.equal((await enquiry([{ id: ctx.pid.widget, qty: 1 }], { customer: buyer('abc') })).status, 400);
    const badPin = await enquiry([{ id: ctx.pid.widget, qty: 1 }], { customer: buyer('9876500002', { pincode: '12345' }) });
    assert.equal(badPin.status, 400);
    assert.match(badPin.body.error, /pincode/i);
    assert.equal((await api('POST', '/api/orders/enquiry', { headers: ip(1), raw: 'not json' })).status, 400);
  });
  it('IT-STORE-11 enquiry is re-priced from the database; client prices are ignored', async () => {
    const res = await enquiry([{ id: ctx.pid.widget, qty: 2, price: 1, unitPrice: 1, name: 'Hacked' }], { total: 2 }, ip(2));
    assert.equal(res.status, 201, JSON.stringify(res.body));
    assert.match(res.body.ref, /^ENQ-/);
    assert.equal(res.body.total, 1000);
    const saved = await db.collection('orderEnquiries').findOne({ ref: res.body.ref });
    assert.equal(saved.total, 1000);
    assert.equal(saved.items[0].unitPrice, 500);
    assert.equal(saved.items[0].name, 'IT Widget');
    assert.equal(saved.status, 'new');
    assert.ok(!('ip' in saved) && saved.ipHash.length === 32, 'raw IP must not be stored');
  });
  it('IT-STORE-12 duplicate cart lines are merged', async () => {
    const res = await enquiry([{ id: ctx.pid.widget, qty: 1 }, { id: ctx.pid.widget, qty: 1 }], { customer: buyer('9876500003') }, ip(3));
    assert.equal(res.status, 201);
    assert.equal(res.body.total, 1000);
    assert.equal((await db.collection('orderEnquiries').findOne({ ref: res.body.ref })).items.length, 1);
  });
  it('IT-STORE-13 unavailable, inactive, unpriced, sold-out and over-stock items are refused', async () => {
    const c = { customer: buyer('9876500004') };
    assert.equal((await enquiry([{ id: 'does-not-exist', qty: 1 }], c, ip(4))).status, 400);
    assert.equal((await enquiry([{ id: ctx.pid.hidden, qty: 1 }], c, ip(4))).status, 400);
    assert.equal((await enquiry([{ id: ctx.pid.unpriced, qty: 1 }], c, ip(4))).status, 400);
    assert.equal((await enquiry([{ id: ctx.pid.soldout, qty: 1 }], c, ip(4))).status, 400);
    const over = await enquiry([{ id: ctx.pid.widget, qty: 5 }], c, ip(4));
    assert.equal(over.status, 400);
    assert.match(over.body.error, /Only 3/);
  });
  it('IT-STORE-13b per-order quantity limit (maxOrderQty) is enforced on the server', async () => {
    const res = await enquiry([{ id: ctx.pid.widget, qty: 3 }], { customer: buyer('9876500006') }, ip(6));
    assert.equal(res.status, 400);
    assert.match(res.body.error, /up to 2/);
  });
  it('IT-STORE-14 honeypot: bots get a fake success and nothing is stored', async () => {
    const before = await db.collection('orderEnquiries').countDocuments();
    const res = await enquiry([{ id: ctx.pid.widget, qty: 1 }], { website: 'http://spam.example' }, ip(5));
    assert.equal(res.status, 200);
    assert.equal(await db.collection('orderEnquiries').countDocuments(), before);
  });
  it('IT-STORE-15 rate limit: 5 enquiries per hour per visitor, 3 per phone number', async () => {
    const mk = (n) => enquiry([{ id: ctx.pid.widget, qty: 1 }], { customer: buyer(`98000000${String(n).padStart(2, '0')}`, { name: 'Rate Test' }) }, ip(60));
    for (let n = 0; n < 5; n++) assert.equal((await mk(n)).status, 201);
    assert.equal((await mk(9)).status, 429);
    const samePhone = (h) => enquiry([{ id: ctx.pid.widget, qty: 1 }], { customer: buyer('9811111111', { name: 'Same Phone' }) }, h);
    for (let n = 0; n < 3; n++) assert.equal((await samePhone(ip(70 + n))).status, 201);
    assert.equal((await samePhone(ip(80))).status, 429);
  });

  it('IT-STORE-20 contact form: validation, storage, honeypot', async () => {
    const send = (json, headers = ip(90)) => api('POST', '/api/contact', { json, headers });
    assert.equal((await send({ name: 'A', email: 'bad', message: 'short' })).status, 400);
    assert.equal((await send({ name: 'Visitor', email: 'visitor@test.local', message: 'short' })).status, 400);
    const ok = await send({ name: 'Visitor', email: 'visitor@test.local', phone: '9876500009', message: 'Which product suits daily energy support?' });
    assert.equal(ok.status, 201);
    assert.match(ok.body.ref, /^MSG-/);
    const saved = await db.collection('contactMessages').findOne({ ref: ok.body.ref });
    assert.equal(saved.email, 'visitor@test.local');
    assert.equal(saved.status, 'new');
    const before = await db.collection('contactMessages').countDocuments();
    assert.equal((await send({ name: 'Bot', email: 'bot@test.local', message: 'Buy cheap pills now please', website: 'x' })).status, 200);
    assert.equal(await db.collection('contactMessages').countDocuments(), before);
  });
  it('IT-STORE-21 contact form is rate limited (5 per hour per visitor)', async () => {
    const send = () => api('POST', '/api/contact', { headers: ip(95), json: { name: 'Spammer', email: 'spam@test.local', message: 'A reasonably long message body' } });
    for (let n = 0; n < 5; n++) assert.equal((await send()).status, 201);
    assert.equal((await send()).status, 429);
  });

  it('IT-STORE-30 admin product edit/delete by the id the admin screens use (was a silent no-op)', async () => {
    const t = ctx.admin.token;
    const created = await api('POST', '/api/data/products', { token: t, json: { id: 'abc123xyz', name: 'Admin Made', sku: 'IT-ADM', price: 111, status: 'active' } });
    assert.equal(created.status, 201);
    const patched = await api('PATCH', '/api/data/products', { token: t, json: { _id: 'abc123xyz', price: 777 } });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.matched, 1);
    assert.equal((await db.collection('products').findOne({ sku: 'IT-ADM' })).price, 777);
    assert.equal((await api('PATCH', '/api/data/products', { token: t, json: { price: 5 } })).status, 400);
    assert.equal((await api('DELETE', '/api/data/products?id=abc123xyz', { token: t })).status, 200);
    assert.equal(await db.collection('products').countDocuments({ sku: 'IT-ADM' }), 0);
  });
});

// ================================================================ 12. HOME PAGE HERO BANNERS
describe('IT-HERO: admin-managed hero banners', () => {
  const home = async () => String((await api('GET', '/')).body);
  const hero = () => db.collection('heroSlides');

  before(async () => {
    await db.collection('products').insertOne({
      id: 'it-hp', slug: 'it-hero-prod', name: 'IT Hero Prod', sku: 'IT-HP', category: 'Herbal Wellness', description: 'Hero test product', benefits: [],
      price: 321, mrp: 400, bvValue: 77, stock: 5, status: 'active', isFeatured: true, createdAt: new Date(),
      images: [{ url: '/assets/products/special-15-noni-juice-500ml/1.webp', order: 0, isPrimary: true }],
    });
    ctx.heroProductId = (await db.collection('products').findOne({ slug: 'it-hero-prod' }))._id.toString();
    await hero().deleteMany({});
    ctx.heroMember = await register(`hero-${rnd()}@test.local`, PASSWORD, 'Hero Member');
  });

  it('IT-HERO-01 hero banners are publicly readable', async () => {
    const res = await api('GET', '/api/data/heroSlides');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('IT-HERO-02 only admins can change banners, upload images or refresh the site', async () => {
    const body = { type: 'banner', title: 'Hacked', active: true };
    denied(await api('POST', '/api/data/heroSlides', { json: body }));
    denied(await api('POST', '/api/data/heroSlides', { token: ctx.heroMember.token, json: body }));
    denied(await api('PATCH', '/api/data/heroSlides', { token: ctx.heroMember.token, json: { _id: 'x', title: 'Hacked' } }));
    denied(await api('DELETE', '/api/data/heroSlides?id=x', { token: ctx.heroMember.token }));
    assert.equal((await api('POST', '/api/admin/upload')).status, 401);
    assert.equal((await api('POST', '/api/admin/upload', { token: ctx.heroMember.token })).status, 403);
    assert.equal((await api('POST', '/api/admin/revalidate')).status, 401);
    assert.equal((await api('POST', '/api/admin/revalidate', { token: ctx.heroMember.token })).status, 403);
    assert.equal(await hero().countDocuments({ title: 'Hacked' }), 0);
  });

  it('IT-HERO-03 upload route validates the file before storing anything', async () => {
    const t = ctx.admin.token;
    assert.equal((await api('POST', '/api/admin/upload', { token: t, form: new FormData() })).status, 400);
    const bad = new FormData(); bad.append('file', new Blob(['hello'], { type: 'text/plain' }), 'x.txt');
    const res = await api('POST', '/api/admin/upload', { token: t, form: bad });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /JPG, PNG or WEBP/);
    const big = new FormData(); big.append('file', new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], { type: 'image/png' }), 'big.png');
    assert.equal((await api('POST', '/api/admin/upload', { token: t, form: big })).status, 400);
    assert.equal((await api('POST', '/api/admin/revalidate', { token: t })).status, 200);
  });

  it('IT-HERO-04 admin can create, edit and delete a banner', async () => {
    const t = ctx.admin.token;
    const made = await api('POST', '/api/data/heroSlides', { token: t, json: { id: 'hero_crud', type: 'banner', title: 'IT Crud Banner', active: true, order: 5 } });
    assert.equal(made.status, 201);
    const patched = await api('PATCH', '/api/data/heroSlides', { token: t, json: { _id: 'hero_crud', title: 'IT Crud Banner v2' } });
    assert.equal(patched.status, 200);
    assert.equal((await hero().findOne({ id: 'hero_crud' })).title, 'IT Crud Banner v2');
    assert.equal((await api('DELETE', '/api/data/heroSlides?id=hero_crud', { token: t })).status, 200);
    assert.equal(await hero().countDocuments({ id: 'hero_crud' }), 0);
  });

  it('IT-HERO-05 the home page shows active banners, hides inactive ones and rejects unsafe links', async () => {
    await hero().insertMany([
      { id: 'h1', type: 'banner', title: 'IT Festive Offer', body: 'Banner body text', ctaLabel: 'Grab it', ctaHref: '/shop', layout: 'split', tone: 'mint', order: 10, active: true },
      { id: 'h2', type: 'banner', title: 'IT Hidden Banner', ctaLabel: 'Nope', ctaHref: '/shop', order: 20, active: false },
      { id: 'h3', type: 'banner', title: 'IT Bad Link Banner', ctaLabel: 'Evil', ctaHref: 'javascript:alert(1)', order: 30, active: true },
    ]);
    const html = await home();
    assert.ok(html.includes('IT Festive Offer') && html.includes('Grab it'));
    assert.ok(!html.includes('IT Hidden Banner'), 'inactive banner must not render');
    assert.ok(html.includes('IT Bad Link Banner'));
    assert.ok(!html.includes('javascript:alert(1)') || !/href="javascript:/.test(html), 'unsafe link must not become a button');
    assert.ok(!html.includes('>Evil<'), 'button with an unsafe link is dropped');
  });

  it('IT-HERO-06 a product banner follows the product: live price and BV, gone when the product is deactivated', async () => {
    await hero().deleteMany({});
    await hero().insertOne({ id: 'hp', type: 'product', productId: ctx.heroProductId, order: 10, active: true });
    let html = await home();
    assert.ok(html.includes('IT Hero Prod') && /321/.test(html) && /77 BV/.test(html), 'product slide shows name, price and BV');
    await db.collection('products').updateOne({ slug: 'it-hero-prod' }, { $set: { price: 654, bvValue: 99 } });
    html = await home();
    assert.ok(/654/.test(html) && /99 BV/.test(html), 'edited price and BV show on the hero');
    await db.collection('products').updateOne({ slug: 'it-hero-prod' }, { $set: { status: 'inactive' } });
    html = await home();
    assert.ok(!/href="\/products\/it-hero-prod"/.test(html.split('<h1')[1]?.split('</section>')[0] || ''), 'inactive product is dropped from the hero');
    await db.collection('products').updateOne({ slug: 'it-hero-prod' }, { $set: { status: 'active' } });
  });

  it('IT-HERO-07 with no banners the hero falls back to featured products', async () => {
    await hero().deleteMany({});
    const html = await home();
    assert.ok(html.includes('IT Hero Prod'));
    await hero().insertOne({ id: 'allhidden', type: 'banner', title: 'IT All Hidden', active: false });
    assert.ok((await home()).includes('IT Hero Prod'), 'still has a hero when every banner is hidden');
    await hero().deleteMany({});
  });
});
