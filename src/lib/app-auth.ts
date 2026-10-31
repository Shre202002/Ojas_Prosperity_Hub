'use client';

import { useEffect, useState } from 'react';
import * as React from 'react';

export type AppUser = { uid: string; email: string; displayName?: string | null; photoURL?: string | null; role?: string | null; getIdToken: (refresh?: boolean) => Promise<string> };
export type AppAuth = { currentUser: AppUser | null };
const tokenKey = 'sjapl_session_token';
let currentUser: AppUser | null = null;
const listeners = new Set<(user: AppUser | null) => void>();
const notify = () => listeners.forEach(listener => listener(currentUser));
const userFromResponse = (user: any, token: string): AppUser => ({ ...user, getIdToken: async () => token });

export const authClient: AppAuth = { get currentUser() { return currentUser; } } as AppAuth;
export function AuthProvider({ children }: { children: React.ReactNode }) { return React.createElement(React.Fragment, null, children); }

export function useAuth() { return authClient; }
export function useUser(_auth?: AppAuth | null) {
  const [user, setUser] = useState<AppUser | null>(currentUser);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const listener = (next: AppUser | null) => setUser(next);
    listeners.add(listener);
    const token = localStorage.getItem(tokenKey);
    if (token) fetch('/api/auth', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).then(result => { currentUser = result?.user ? userFromResponse(result.user, token) : null; setUser(currentUser); }).finally(() => setLoading(false));
    else setLoading(false);
    return () => { listeners.delete(listener); };
  }, []);
  return { user, loading };
}

async function authenticate(mode: 'login' | 'register', email: string, password: string, name?: string) {
  const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, email, password, name }) });
  const result = await response.json();
  if (!response.ok) throw Object.assign(new Error(result.error || 'Authentication failed.'), { code: result.code });
  localStorage.setItem(tokenKey, result.token);
  currentUser = userFromResponse(result.user, result.token);
  notify();
  return { user: currentUser };
}

export const signInWithEmailAndPassword = (_auth: AppAuth, email: string, password: string) => authenticate('login', email, password);
export const createUserWithEmailAndPassword = (_auth: AppAuth, email: string, password: string) => authenticate('register', email, password);
export async function signOut(_auth?: AppAuth) { localStorage.removeItem(tokenKey); currentUser = null; notify(); await fetch('/api/auth', { method: 'DELETE' }); }
export async function updateProfile(user: AppUser, profile: { displayName?: string; photoURL?: string }) { Object.assign(user, profile); await apiRequest('/api/profile', 'PATCH', profile); notify(); }
export async function updatePassword(_user: AppUser, password: string) { await apiRequest('/api/auth/password', 'POST', { password }); }
export async function sendPasswordResetEmail(_auth: AppAuth, email: string, _settings?: unknown) { await apiRequest('/api/auth/reset', 'POST', { email }); }
export async function confirmPasswordReset(_auth: AppAuth, code: string, newPassword: string) { await apiRequest('/api/auth/reset', 'PATCH', { code, password: newPassword }); }
export async function verifyPasswordResetCode(_auth: AppAuth, code: string) { const result = await apiRequest(`/api/auth/reset?code=${encodeURIComponent(code)}`, 'GET'); return result.email; }
export class GoogleAuthProvider {}
export async function signInWithPopup(_auth?: AppAuth, _provider?: unknown): Promise<{ user: AppUser }> { throw new Error('Google sign-in is not configured for MongoDB authentication.'); }
export async function apiRequest(url: string, method = 'GET', body?: unknown) {
  const token = localStorage.getItem(tokenKey);
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Request failed.');
  return result;
}
export * from './app-db';
