'use client';
import { useSyncExternalStore } from 'react';
import { initialFilings, type Filing } from '@/data/admin/compliance';
const KEY = 'registat:admin:compliance:v1';
const EVENT = 'registat:admin:compliance-changed';
let cachedRaw: string | null | undefined;
let cache = initialFilings;
function snapshot(): Filing[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      cache = Array.isArray(parsed) && parsed.every(item => item && typeof item.id === 'string' && Array.isArray(item.documents)) ? parsed : initialFilings;
      cachedRaw = raw;
    }
  } catch { /* Retain usable records when storage is unavailable. */ }
  return cache;
}
function subscribe(callback: () => void) { window.addEventListener(EVENT, callback); window.addEventListener('storage', callback); return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); }; }
export function useFilings() { return useSyncExternalStore(subscribe, snapshot, () => initialFilings); }
export function saveFiling(filing: Filing) {
  const records = snapshot();
  const next = records.some(item => item.id === filing.id) ? records.map(item => item.id === filing.id ? filing : item) : [filing, ...records];
  const raw = JSON.stringify(next); localStorage.setItem(KEY, raw); cachedRaw = raw; cache = next; window.dispatchEvent(new Event(EVENT));
}
