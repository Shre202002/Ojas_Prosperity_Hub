// Run: node scripts/test-withdrawal-limits.mjs  (logic mirrors summarizeWindow in src/lib/withdrawal-limits.ts)
import assert from 'node:assert/strict';
const WINDOW = 12 * 60 * 60 * 1000;
const round2 = v => Math.round(v * 100) / 100;
const summarize = (rows, cap, now) => {
  const inWin = rows.filter(r => now - r.createdAt <= WINDOW).sort((a, b) => a.createdAt - b.createdAt);
  const used = round2(inWin.reduce((s, r) => s + r.amount, 0));
  return { used, remaining: Math.max(0, round2(cap - used)), next: inWin[0] ? inWin[0].createdAt + WINDOW : null };
};
const now = Date.now(), cap = 2500;
const allowed = (rows, amount) => { const u = summarize(rows, cap, now); return u.used + amount <= cap; };
assert.equal(allowed([], 50000), false, 'first request above the cap must be rejected (old NaN bug)');
assert.equal(allowed([], 2500), true);
assert.equal(allowed([{ amount: 1000, createdAt: now - 3600e3 }], 1500), true);
assert.equal(allowed([{ amount: 1000, createdAt: now - 3600e3 }, { amount: 1000, createdAt: now - 7200e3 }], 1000), false, 'sum of several rows counts, not just one');
assert.equal(allowed([{ amount: 2500, createdAt: now - 13 * 3600e3 }], 2500), true, 'window frees after 12h');
const u = summarize([{ amount: 2500, createdAt: now - 2 * 3600e3 }], cap, now);
assert.equal(u.remaining, 0); assert.equal(u.next, now - 2 * 3600e3 + WINDOW);
console.log('withdrawal limit checks passed');
