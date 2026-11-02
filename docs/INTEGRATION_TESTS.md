# Integration Test Cases & Results

Last run: **152 tests, 152 passed, 0 failed** (suite: `tests/integration/app.integration.test.mjs`).

## How it runs
```
npm run test:integration
```
- Boots the real Next.js app on port **9004** and drives the HTTP API with real MongoDB transactions.
- Uses an **isolated database `ojas_integration_test`** on your Atlas cluster, dropped at the end. Your real database (`ojas_prosperity_hub`) is never touched.
- External services are disabled for the run: Razorpay uses test secrets (webhooks are signed locally), ImageKit, SMTP and RazorpayX are blank. Reset emails are captured from the server log.
- Needs `MONGODB_URI` in `.env`. Takes about 5 to 6 minutes (the first request to each route compiles it).

## Findings from the first run (all fixed)
The first run had 8 failing tests that exposed real defects. All are now fixed and the suite is green.

| Severity | Test | Finding | Fix |
|---|---|---|---|
| **Critical** | IT-SEC-05, IT-SEC-09 | A member could `POST /api/data/transactions` a fake `status:"paid"` order and use it to enroll for free, crediting the sponsor a real 10% commission. | Every write (`POST`/`PATCH`/`DELETE`) on `/api/data/*` is now admin-only (`src/app/api/data/[collection]/route.ts`). Members change data only through purpose-built routes. |
| **High** | IT-SEC-02 | Any member could read another user's record including `passwordHash`. | `users` reads are limited to the caller's own record (admins excepted) and `passwordHash` is always projected out. |
| **High** | IT-SEC-03 | Any member could forge referral codes. | Covered by the admin-only writes above. |
| **High** | IT-SEC-04 | Any member could insert `users` documents with `role:"admin"`. | Covered by the admin-only writes above. |
| Medium | IT-PKG-01 | `POST /api/mongo/bootstrap` always failed because of an invalid `settings._id` unique index. | Removed that line in `src/lib/mongo-repositories.ts`. |
| Low | IT-NET-01, IT-NET-09 | Valid rejections returned HTTP 500. | `src/app/api/network/provision/route.ts` now uses a typed `HttpError` (403 for the admin claim, 400 for sponsor-KYC). |

Also fixed in `/api/data/*`: `DELETE` no longer accepts collection names outside the allow-list, and admin edits/deletes now match the app-level string `id` the admin screens use (they previously did nothing; covered by IT-STORE-30).

Note: in dev mode React embeds raw database records in a debug payload in the page HTML, so storefront tests assert on rendered product-card links rather than raw text.

## Test cases

### IT-AUTH: Authentication & sessions (12)

| ID | Case | Result |
|---|---|---|
| IT-AUTH-01 | registers a member (role user) | PASS |
| IT-AUTH-02 | rejects duplicate email | PASS |
| IT-AUTH-03 | rejects password shorter than 6 and missing email | PASS |
| IT-AUTH-04 | logs in with correct password; rejects wrong password and unknown user | PASS |
| IT-AUTH-05 | email is case/space insensitive | PASS |
| IT-AUTH-06 | session endpoint returns the user; no/garbage token is 401 | PASS |
| IT-AUTH-07 | password hash is never exposed by auth responses and is stored salted+hashed | PASS |
| IT-AUTH-08 | logout invalidates the token | PASS |
| IT-AUTH-09 | expired session is rejected | PASS |
| IT-AUTH-10 | Super Admin email registers as admin; others never get admin | PASS |
| IT-AUTH-11 | a member cannot self-promote by sending role/mode in the register body | PASS |
| IT-AUTH-12 | profile update changes the display name; requires auth | PASS |

### IT-PWD: Forgot / reset password (11)

| ID | Case | Result |
|---|---|---|
| IT-PWD-01 | invalid email is a 400 | PASS |
| IT-PWD-02 | unknown email answers success but sends nothing and stores nothing | PASS |
| IT-PWD-03 | known email gets a reset email; only a hash is stored; TTL index exists | PASS |
| IT-PWD-04 | a second request inside the cooldown sends no new email | PASS |
| IT-PWD-05 | verify endpoint accepts the good code and rejects a bad one | PASS |
| IT-PWD-06 | weak password and missing code are rejected | PASS |
| IT-PWD-07 | expired code is rejected | PASS |
| IT-PWD-08 | reset works end-to-end: new password logs in, old one fails, old sessions are signed out | PASS |
| IT-PWD-09 | the link is single-use | PASS |
| IT-PWD-10 | a newer request invalidates the older link | PASS |
| IT-PWD-11 | super admin can use the same flow | PASS |

### IT-AUTHZ: Authorization matrix (anonymous and member callers vs. member/admin endpoints) (44)

| ID | Case | Result |
|---|---|---|
| IT-AUTHZ | anonymous GET /api/wallet is denied | PASS |
| IT-AUTHZ | anonymous GET /api/wallet/transactions is denied | PASS |
| IT-AUTHZ | anonymous GET /api/matching is denied | PASS |
| IT-AUTHZ | anonymous GET /api/wallet/withdraw is denied | PASS |
| IT-AUTHZ | anonymous POST /api/wallet/convert is denied | PASS |
| IT-AUTHZ | anonymous POST /api/wallet/withdraw is denied | PASS |
| IT-AUTHZ | anonymous POST /api/matching is denied | PASS |
| IT-AUTHZ | anonymous PATCH /api/profile is denied | PASS |
| IT-AUTHZ | anonymous POST /api/network/provision is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/users is denied | PASS |
| IT-AUTHZ | member GET /api/admin/users is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/kyc is denied | PASS |
| IT-AUTHZ | member GET /api/admin/kyc is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/withdrawals is denied | PASS |
| IT-AUTHZ | member GET /api/admin/withdrawals is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/packages is denied | PASS |
| IT-AUTHZ | member GET /api/admin/packages is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/settings is denied | PASS |
| IT-AUTHZ | member GET /api/admin/settings is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/company-ledger is denied | PASS |
| IT-AUTHZ | member GET /api/admin/company-ledger is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/company-overview is denied | PASS |
| IT-AUTHZ | member GET /api/admin/company-overview is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/wallet is denied | PASS |
| IT-AUTHZ | member GET /api/admin/wallet is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/wallet-transactions is denied | PASS |
| IT-AUTHZ | member GET /api/admin/wallet-transactions is denied | PASS |
| IT-AUTHZ | anonymous GET /api/admin/company-commissions is denied | PASS |
| IT-AUTHZ | member GET /api/admin/company-commissions is denied | PASS |
| IT-AUTHZ | anonymous POST /api/admin/packages is denied | PASS |
| IT-AUTHZ | member POST /api/admin/packages is denied | PASS |
| IT-AUTHZ | anonymous PATCH /api/admin/packages is denied | PASS |
| IT-AUTHZ | member PATCH /api/admin/packages is denied | PASS |
| IT-AUTHZ | anonymous PATCH /api/admin/withdrawals is denied | PASS |
| IT-AUTHZ | member PATCH /api/admin/withdrawals is denied | PASS |
| IT-AUTHZ | anonymous PATCH /api/admin/kyc is denied | PASS |
| IT-AUTHZ | member PATCH /api/admin/kyc is denied | PASS |
| IT-AUTHZ | anonymous PUT /api/admin/bv-rate is denied | PASS |
| IT-AUTHZ | member PUT /api/admin/bv-rate is denied | PASS |
| IT-AUTHZ | anonymous PATCH /api/admin/settings is denied | PASS |
| IT-AUTHZ | member PATCH /api/admin/settings is denied | PASS |
| IT-AUTHZ | anonymous POST /api/mongo/bootstrap is denied | PASS |
| IT-AUTHZ | member POST /api/mongo/bootstrap is denied | PASS |
| IT-AUTHZ | failed admin attempts changed nothing | PASS |

### IT-PKG: BV rate, settings & packages (6)

| ID | Case | Result |
|---|---|---|
| IT-PKG-01 | admin bootstraps indexes | PASS |
| IT-PKG-02 | public config endpoints respond | PASS |
| IT-PKG-03 | admin creates a package; price = BV x active rate; validation + duplicates | PASS |
| IT-PKG-04 | public list shows only active packages with computed price | PASS |
| IT-PKG-05 | BV of a package cannot be changed once a transaction uses it | PASS |
| IT-PKG-06 | admin can read and tighten platform settings | PASS |

### IT-PAY: Payments (Razorpay webhook + verify) (5)

| ID | Case | Result |
|---|---|---|
| IT-PAY-01 | webhook rejects missing / wrong / tampered signatures | PASS |
| IT-PAY-02 | a signed payment.captured marks the order paid and credits the company ledger once | PASS |
| IT-PAY-03 | payment.failed marks the order failed | PASS |
| IT-PAY-04 | client verify endpoint validates the signature | PASS |
| IT-PAY-05 | verify for an unknown order is rejected | PASS |

### IT-NET: Network provisioning, binary tree, KYC, commissions (16)

| ID | Case | Result |
|---|---|---|
| IT-NET-01 | a non-super-admin cannot claim admin registration | PASS |
| IT-NET-02 | Super Admin is provisioned as the root with two referral codes; repeat call is idempotent | PASS |
| IT-NET-03 | enrollment needs a verified payment | PASS |
| IT-NET-04 | enrollment needs a valid package and a matching payment | PASS |
| IT-NET-05 | enrollment needs a valid referral code | PASS |
| IT-NET-06 | member 1 joins under the admin LEFT code: placement, upline counts, 10% direct commission, ledger rows | PASS |
| IT-NET-07 | the same user / payment cannot enroll twice | PASS |
| IT-NET-08 | a payment already linked to another account is rejected | PASS |
| IT-NET-09 | a sponsor without verified KYC cannot refer | PASS |
| IT-NET-10 | KYC: member submit without files fails; with a file but ImageKit unconfigured fails safely | PASS |
| IT-NET-11 | KYC review: admin verifies member 1 (validation + effect) | PASS |
| IT-NET-12 | member 2 joins under member 1 (now KYC-verified): placed on m1 left; sponsor m1 earns 10 BV; upline BV rolls up | PASS |
| IT-NET-13 | outer-leg spillover: another member on the admin LEFT code lands under m2 | PASS |
| IT-NET-14 | admin RIGHT code fills the right leg | PASS |
| IT-NET-15 | tree integrity: no node has two parents, counts match descendants | PASS |
| IT-NET-16 | concurrent enrollments on the same slot never double-book it | PASS |

### IT-MATCH: Matching commission (5)

| ID | Case | Result |
|---|---|---|
| IT-MATCH-01 | lots exist only for the placement parent and are readable by the owner | PASS |
| IT-MATCH-02 | invalid selections are rejected | PASS |
| IT-MATCH-03 | a member cannot match someone else's lots | PASS |
| IT-MATCH-04 | equal-BV left+right lots produce a 15% matching commission and are consumed | PASS |
| IT-MATCH-05 | the same lots cannot be matched twice | PASS |

### IT-WAL: Wallet, conversion, withdrawals (12)

| ID | Case | Result |
|---|---|---|
| IT-WAL-01 | wallet summary reflects balances | PASS |
| IT-WAL-02 | conversion rejects invalid / excessive amounts | PASS |
| IT-WAL-03 | purchased BV is not convertible: a member with only purchased BV cannot convert | PASS |
| IT-WAL-04 | converting commission BV moves value to withdrawable INR at the platform rate (atomic ledger rows) | PASS |
| IT-WAL-05 | withdrawal validation: amount, UPI, minimum | PASS |
| IT-WAL-06 | a valid withdrawal debits the wallet and is queued as pending (manual payout mode) | PASS |
| IT-WAL-07 | the 12-hour cap is enforced (cap 300: 120 used, +200 refused, +180 allowed, then blocked) | PASS |
| IT-WAL-08 | a member without verified KYC cannot withdraw | PASS |
| IT-WAL-09 | admin payout actions: approve then mark paid; reject refunds; illegal transitions refused | PASS |
| IT-WAL-10 | double-spend: two simultaneous withdrawals of more than half the balance -> exactly one succeeds | PASS |
| IT-WAL-11 | double-convert: two simultaneous conversions of the full commission balance -> exactly one succeeds | PASS |
| IT-WAL-12 | users can only read their own wallet detail | PASS |

### IT-ADM: Admin dashboards & company ledger (4)

| ID | Case | Result |
|---|---|---|
| IT-ADM-01 | admin read endpoints all respond 200 with data and never leak password hashes | PASS |
| IT-ADM-02 | company ledger reconciles: revenue credits = paid purchases, payouts = credited commissions | PASS |
| IT-ADM-03 | admin changes the BV rate; new packages price at the new rate; existing paid orders keep the old price | PASS |
| IT-ADM-04 | BV rate validation | PASS |

### IT-SEC: Generic /api/data/* hardening (10)

| ID | Case | Result |
|---|---|---|
| IT-SEC-01 | anonymous cannot read private collections | PASS |
| IT-SEC-02 | a member cannot read another user's account record (no password hash, no foreign data) | PASS |
| IT-SEC-03 | a member cannot forge referral codes | PASS |
| IT-SEC-04 | a member cannot insert/modify user records or escalate to admin | PASS |
| IT-SEC-05 | a member cannot create transactions that look paid, packages, or distributors | PASS |
| IT-SEC-06 | a member cannot update or delete data | PASS |
| IT-SEC-07 | listing all distributors / transactions needs admin | PASS |
| IT-SEC-09 | EXPLOIT: a member cannot enroll for free with a self-made "paid" transaction | PASS |
| IT-SEC-10 | EXPLOIT: inserting a user record with role admin must not grant admin APIs | PASS |
| IT-SEC-08 | public referral lookup requires a code | PASS |

### IT-STORE: Public storefront, order enquiries, contact form, admin product edit (27)

| ID | Case | Result |
|---|---|---|
| IT-STORE | page / renders | PASS |
| IT-STORE | page /shop renders | PASS |
| IT-STORE | page /about renders | PASS |
| IT-STORE | page /contact renders | PASS |
| IT-STORE | page /faq renders | PASS |
| IT-STORE | page /privacy renders | PASS |
| IT-STORE | page /terms renders | PASS |
| IT-STORE | page /refund-policy renders | PASS |
| IT-STORE | page /shipping-policy renders | PASS |
| IT-STORE | page /disclaimer renders | PASS |
| IT-STORE | page /cart renders | PASS |
| IT-STORE | page /order-received?ref=ENQ-TEST renders | PASS |
| IT-STORE | page /products/it-widget renders | PASS |
| IT-STORE-01 | unknown pages and products return 404 | PASS |
| IT-STORE-02 | only active, priced products are public (shop, product page, sitemap) | PASS |
| IT-STORE-03 | shop search and category filter work | PASS |
| IT-STORE-04 | product page ships SEO data and no fake ratings | PASS |
| IT-STORE-05 | robots.txt hides private areas and points to the sitemap | PASS |
| IT-STORE-10 | enquiry validation | PASS |
| IT-STORE-11 | enquiry is re-priced from the database; client prices are ignored | PASS |
| IT-STORE-12 | duplicate cart lines are merged | PASS |
| IT-STORE-13 | unavailable, inactive, unpriced, sold-out and over-stock items are refused | PASS |
| IT-STORE-14 | honeypot: bots get a fake success and nothing is stored | PASS |
| IT-STORE-15 | rate limit: 5 enquiries per hour per visitor, 3 per phone number | PASS |
| IT-STORE-20 | contact form: validation, storage, honeypot | PASS |
| IT-STORE-21 | contact form is rate limited (5 per hour per visitor) | PASS |
| IT-STORE-30 | admin product edit/delete by the id the admin screens use (was a silent no-op) | PASS |
