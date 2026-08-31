'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from './app-auth';

export type AppRef = { path: string; collection: string; id?: string };
export type AppQuery = { collection: string; filters: Record<string, string> };
const appDb = Object.freeze({});
export const useFirestore = () => appDb;
export const useMemoFirebase = <T>(factory: () => T, deps: unknown[] = []) => useMemo(factory, deps);
export function doc(_db: unknown, collectionName: string | AppQuery, id?: string): AppRef;
export function doc(collectionRef: AppQuery): AppRef;
export function doc(_dbOrCollection: unknown, collectionName?: string | AppQuery, id?: string): AppRef { const source = collectionName === undefined ? _dbOrCollection as AppQuery : collectionName; const name = typeof source === 'string' ? source : (source as AppQuery).collection; const key = id || Math.random().toString(36).slice(2); return { path: `${name}/${key}`, collection: name, id: key }; }
export function collection(_db: unknown, collectionName: string): AppQuery { return { collection: collectionName, filters: {} }; }
export function query(base: AppQuery, ...parts: any[]): AppQuery { return { ...base, filters: Object.assign({}, base.filters, ...parts.filter(p => p?.field).map(p => ({ [p.field]: String(p.value) }))) }; }
export const where = (field: string, _operator: string, value: unknown) => ({ field, value });
export const orderBy = (..._args: unknown[]) => ({});
export const limit = (..._args: unknown[]) => ({});
export const serverTimestamp = () => new Date();
export async function getDoc(ref: AppRef) {
  const token = localStorage.getItem('ojas_session_token');
  const endpoint = ref.collection === 'transactions' && !token ? '/api/payment-status' : `/api/data/${ref.collection}`;
  const lookupKey = ref.collection === 'referralCodes' ? 'code' : 'id';
  const result = await apiRequest(`${endpoint}?${lookupKey}=${encodeURIComponent(ref.id || '')}`);
  const record = result.data?.[0] || result.data;
  return { exists: () => Boolean(record), data: () => record };
}
export async function getDocs(q: AppQuery) { const params = new URLSearchParams(q.filters); const result = await apiRequest(`/api/data/${q.collection}?${params}`); return { empty: !result.data?.length, docs: result.data || [] }; }
export async function setDoc(ref: AppRef, data: any, _options?: unknown) { return apiRequest(`/api/data/${ref.collection}`, 'POST', { ...data, id: ref.id }); }
export async function updateDoc(ref: AppRef, data: any) { return apiRequest(`/api/data/${ref.collection}`, 'PATCH', { ...data, _id: ref.id }); }
export async function deleteDoc(ref: AppRef) { return apiRequest(`/api/data/${ref.collection}?id=${encodeURIComponent(ref.id || '')}`, 'DELETE'); }
export function useDoc<T = any>(ref: AppRef | null) {
  const [data, setData] = useState<T | null>(null); const [loading, setLoading] = useState(Boolean(ref)); const [error, setError] = useState<Error | null>(null);
  useEffect(() => { if (!ref) { setLoading(false); return; } let cancelled = false; setLoading(true); getDoc(ref).then(result => { if (!cancelled) { setData(result.data() as T || null); setLoading(false); } }).catch(e => { if (!cancelled) { setError(e); setLoading(false); } }); return () => { cancelled = true; }; }, [ref?.path]);
  return { data, loading, error };
}
export function useCollection<T = any>(q: AppQuery | null, _path?: string) {
  const [data, setData] = useState<T[]>([]); const [loading, setLoading] = useState(Boolean(q)); const [error, setError] = useState<Error | null>(null);
  useEffect(() => { if (!q) { setLoading(false); return; } let cancelled = false; setLoading(true); const params = new URLSearchParams(q.filters); apiRequest(`/api/data/${q.collection}?${params}`).then(result => { if (!cancelled) { setData(result.data || []); setLoading(false); } }).catch(e => { if (!cancelled) { setError(e); setLoading(false); } }); return () => { cancelled = true; }; }, [q?.collection, JSON.stringify(q?.filters)]);
  return { data, loading, error };
}
