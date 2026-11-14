// Shared by client and server so the BV rules cannot drift. A plan is filled when cart BV is in [plan.bv - BV_TOLERANCE, plan.bv].
export const BV_TOLERANCE = 10;

type PlanBv = { bv: number };

export const isPlanFilled = (plan: PlanBv, totalBv: number) => totalBv <= plan.bv && totalBv >= plan.bv - BV_TOLERANCE;
export const bvLeft = (plan: PlanBv, totalBv: number) => plan.bv - totalBv;
export const canAddBv = (plan: PlanBv, totalBv: number, productBv: number) => totalBv + productBv <= plan.bv;
export const planMatch = <T extends PlanBv>(totalBv: number, plans: T[]) => plans.find((p) => isPlanFilled(p, totalBv)) ?? null;

// ---------------------------------------------------------------------------------------------------------------------
// Completion suggestions: when the remaining BV can't be filled by any product (e.g. 55 BV left but the smallest
// product is 110 BV), work out which items to add, or which to swap out, to land inside the plan's BV window.
// ---------------------------------------------------------------------------------------------------------------------
export type SuggestProduct = { id: string; bv: number; price: number; inStock: boolean; maxOrderQty?: number | null };
export type SuggestItem = { id: string; bv: number; qty: number };
export type Suggestion = {
  /** Units to take out of the cart (empty when the plan can be finished by adding only). */
  remove: { id: string; qty: number }[];
  /** Units to put in. */
  add: { id: string; qty: number }[];
  /** Cart BV after applying the suggestion. */
  finalBv: number;
};

const MAX_UNITS = 20;
const GAP_CAP = 3000; // suggestions are only needed for small gaps; keeps the search tiny

/** Fewest units (from `pool`, honouring per-product limits) whose BV lands in [lo, hi]. */
function findAdds(pool: SuggestProduct[], limits: Map<string, number>, lo: number, hi: number): { id: string; qty: number }[] | null {
  if (hi <= 0 || hi > GAP_CAP) return null;
  lo = Math.max(1, lo);
  const copies: SuggestProduct[] = [];
  for (const p of pool) {
    const n = Math.min(limits.get(p.id) ?? MAX_UNITS, Math.floor(hi / p.bv));
    for (let i = 0; i < n; i++) copies.push(p);
  }
  const INF = 1e9;
  const dp = new Int32Array(hi + 1).fill(INF);
  dp[0] = 0;
  const took = copies.map(() => new Uint8Array(hi + 1));
  copies.forEach((p, i) => {
    for (let b = hi; b >= p.bv; b--) {
      if (dp[b - p.bv] + 1 < dp[b]) { dp[b] = dp[b - p.bv] + 1; took[i][b] = 1; }
    }
  });
  let best = -1;
  for (let b = hi; b >= lo; b--) if (dp[b] < INF && (best === -1 || dp[b] < dp[best])) best = b;
  if (best === -1) return null;
  const picked = new Map<string, number>();
  let b = best;
  for (let i = copies.length - 1; i >= 0 && b > 0; i--) {
    if (took[i][b]) { picked.set(copies[i].id, (picked.get(copies[i].id) ?? 0) + 1); b -= copies[i].bv; }
  }
  return [...picked].map(([id, qty]) => ({ id, qty }));
}

export function suggestCompletion(products: SuggestProduct[], items: SuggestItem[], plan: PlanBv): Suggestion | null {
  const total = items.reduce((s, i) => s + i.qty * i.bv, 0);
  const left = plan.bv - total;
  if (left <= BV_TOLERANCE || left > plan.bv) return null; // already filled (or over)
  const pool = products.filter((p) => p.inStock && p.bv > 0);
  const inCart = new Map(items.map((i) => [i.id, i.qty]));
  const limitFor = (p: SuggestProduct, extraFree = 0) => Math.max(0, Math.min(p.maxOrderQty || MAX_UNITS, MAX_UNITS) - (inCart.get(p.id) ?? 0) + extraFree);
  const limits = new Map(pool.map((p) => [p.id, limitFor(p)]));
  const bvOf = (id: string) => pool.find((p) => p.id === id)?.bv ?? 0;
  const sumBv = (list: { id: string; qty: number }[]) => list.reduce((s, x) => s + x.qty * bvOf(x.id), 0);

  // 1) Finish by only adding products.
  const addOnly = findAdds(pool, limits, left - BV_TOLERANCE, left);
  if (addOnly) return { remove: [], add: addOnly, finalBv: total + sumBv(addOnly) };

  // 2) Dead-lock: swap out one unit (or two units from different items) and refill the bigger gap.
  type Candidate = { remove: { id: string; qty: number }[]; freed: number };
  const candidates: Candidate[] = [];
  for (const it of items) for (let r = 1; r <= it.qty; r++) candidates.push({ remove: [{ id: it.id, qty: r }], freed: r * it.bv });
  for (let a = 0; a < items.length; a++) for (let c = a + 1; c < items.length; c++) {
    candidates.push({ remove: [{ id: items[a].id, qty: 1 }, { id: items[c].id, qty: 1 }], freed: items[a].bv + items[c].bv });
  }
  let best: { cand: Candidate; add: { id: string; qty: number }[]; cost: number } | null = null;
  for (const cand of candidates) {
    const gap = left + cand.freed;
    const removedIds = new Set(cand.remove.map((r) => r.id));
    const swapPool = pool.filter((p) => !removedIds.has(p.id)); // a swap must bring in different products
    const swapLimits = new Map(swapPool.map((p) => [p.id, limitFor(p)]));
    const add = findAdds(swapPool, swapLimits, gap - BV_TOLERANCE, gap);
    if (!add) continue;
    const cost = cand.remove.reduce((s, r) => s + r.qty, 0) + add.reduce((s, a) => s + a.qty, 0);
    if (!best || cost < best.cost) best = { cand, add, cost };
  }
  if (!best) return null;
  return { remove: best.cand.remove, add: best.add, finalBv: total - best.cand.freed + sumBv(best.add) };
}
