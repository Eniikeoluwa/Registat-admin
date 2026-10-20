'use client';
import { useSyncExternalStore } from 'react';
import { initialSettings, type AdminSettings, type AuditEntry } from '@/data/admin/settings';
const KEY = 'registat:admin:settings:v1';
const EVENT = 'registat:admin:settings-changed';
let cachedRaw: string | null | undefined;
let cache = initialSettings;
function snapshot(): AdminSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      cache = parsed && typeof parsed === 'object' && 'profile' in parsed && 'admins' in parsed && 'audit' in parsed ? parsed as AdminSettings : initialSettings;
      cachedRaw = raw;
    }
  } catch { /* Keep the last valid snapshot. */ }
  return cache;
}
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}
export function useAdminSettings() { return useSyncExternalStore(subscribe, snapshot, () => initialSettings); }
export function saveAdminSettings(update: (current: AdminSettings) => AdminSettings) {
  const next = update(snapshot());
  const raw = JSON.stringify(next);
  localStorage.setItem(KEY, raw);
  cachedRaw = raw;
  cache = next;
  window.dispatchEvent(new Event(EVENT));
}
export function recordAdminAction(action: Omit<AuditEntry, 'id' | 'at'>) {
  saveAdminSettings(current => ({ ...current, audit: [{ ...action, id: crypto.randomUUID(), at: new Date().toISOString() }, ...current.audit] }));
}
