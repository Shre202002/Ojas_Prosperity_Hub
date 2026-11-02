'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';

// Only what the cart UI needs. Prices here are for display; the server re-prices every order from the database.
export type CartItem = { id: string; slug: string; name: string; price: number; bv: number; image: string; qty: number; /** Per-order limit set by the shop for this product. */ maxQty?: number };
export type CartPlan = { id: string; bv: number };
type State = { items: CartItem[]; hydrated: boolean; plan: CartPlan | null };
type Action =
  | { type: 'hydrate'; items: CartItem[]; plan: CartPlan | null }
  | { type: 'setPlan'; plan: CartPlan | null }
  | { type: 'add'; item: Omit<CartItem, 'qty'>; qty: number }
  | { type: 'setQty'; id: string; qty: number }
  | { type: 'remove'; id: string }
  | { type: 'clear' };

const STORAGE_KEY = 'sjapl_cart_v2';
const PLAN_KEY = 'sjapl_cart_plan_v1';
export const MAX_QTY = 20;
const clampQty = (qty: number, max?: number) => Math.min(max && max > 0 ? Math.min(max, MAX_QTY) : MAX_QTY, Math.max(1, Math.floor(Number(qty) || 1)));

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return { items: action.items, hydrated: true, plan: action.plan };
    case 'setPlan':
      return { ...state, plan: action.plan };
    case 'add': {
      const existing = state.items.find((i) => i.id === action.item.id);
      const items = existing
        ? state.items.map((i) => (i.id === action.item.id ? { ...i, ...action.item, qty: clampQty(i.qty + action.qty, action.item.maxQty) } : i))
        : [...state.items, { ...action.item, qty: clampQty(action.qty, action.item.maxQty) }];
      return { ...state, items };
    }
    case 'setQty':
      return { ...state, items: state.items.map((i) => (i.id === action.id ? { ...i, qty: clampQty(action.qty, i.maxQty) } : i)) };
    case 'remove':
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case 'clear':
      return { ...state, items: [] };
  }
}

function readPlan(): CartPlan | null {
  try {
    const p = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null');
    return p && typeof p.id === 'string' && Number(p.bv) > 0 ? { id: p.id, bv: Number(p.bv) } : null;
  } catch { return null; }
}

function readStored(): CartItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((i) => i && typeof i.id === 'string' && typeof i.name === 'string' && Number.isFinite(Number(i.price)))
      .map((i) => ({ id: i.id, slug: String(i.slug || ''), name: i.name, price: Number(i.price), bv: Math.max(0, Number(i.bv) || 0), image: String(i.image || ''), maxQty: Number(i.maxQty) > 0 ? Number(i.maxQty) : undefined, qty: clampQty(i.qty, Number(i.maxQty)) }));
  } catch {
    return [];
  }
}

type CartContextValue = {
  items: CartItem[];
  /** False until the saved cart has been read, so server and first client render match. */
  hydrated: boolean;
  count: number;
  subtotal: number;
  /** Sum of qty x BV across the cart. */
  totalBv: number;
  /** Plan the shopper is filling, or null when browsing without one. */
  plan: CartPlan | null;
  setPlan: (plan: CartPlan | null) => void;
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false, plan: null });
  const skipFirstWrite = useRef(true);

  useEffect(() => { dispatch({ type: 'hydrate', items: readStored(), plan: readPlan() }); }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    if (skipFirstWrite.current) { skipFirstWrite.current = false; return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
      if (state.plan) localStorage.setItem(PLAN_KEY, JSON.stringify(state.plan)); else localStorage.removeItem(PLAN_KEY);
    } catch { /* private mode / storage blocked: cart still works for this visit */ }
  }, [state.items, state.plan, state.hydrated]);

  // Keep several open tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === PLAN_KEY) dispatch({ type: 'hydrate', items: readStored(), plan: readPlan() }); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((item: Omit<CartItem, 'qty'>, qty = 1) => dispatch({ type: 'add', item, qty }), []);
  const setQty = useCallback((id: string, qty: number) => dispatch({ type: 'setQty', id, qty }), []);
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), []);
  const clear = useCallback(() => dispatch({ type: 'clear' }), []);
  const setPlan = useCallback((plan: CartPlan | null) => dispatch({ type: 'setPlan', plan }), []);

  const value = useMemo<CartContextValue>(() => ({
    items: state.items,
    hydrated: state.hydrated,
    count: state.items.reduce((sum, i) => sum + i.qty, 0),
    subtotal: state.items.reduce((sum, i) => sum + i.qty * i.price, 0),
    totalBv: state.items.reduce((sum, i) => sum + i.qty * i.bv, 0),
    plan: state.plan,
    setPlan,
    add, setQty, remove, clear,
  }), [state, add, setQty, remove, clear, setPlan]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>.');
  return context;
}
