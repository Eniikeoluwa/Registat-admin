'use client';
import { useSyncExternalStore } from 'react';
import { initialJurisdictions, type Jurisdiction } from '@/data/admin/jurisdictions';
const KEY = 'registat:admin:jurisdictions:v1';
const EVENT = 'registat:admin:jurisdictions-changed';
let cachedRaw: string | null | undefined;
let cache = initialJurisdictions;
function snapshot(): Jurisdiction[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      cache = Array.isArray(parsed) && parsed.every(item => item && typeof item.id === 'string' && Array.isArray(item.services) && Array.isArray(item.requirements)) ? parsed : initialJurisdictions;
      cachedRaw = raw;
    }
  } catch { /* Retain last usable data. */ }
  return cache;
}
function subscribe(callback: () => void) { window.addEventListener(EVENT, callback); window.addEventListener('storage', callback); return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); }; }
export function useJurisdictions() { return useSyncExternalStore(subscribe, snapshot, () => initialJurisdictions); }
export function saveJurisdiction(item: Jurisdiction) {
  if (!item.name.trim() || !/^[A-Z]{2}$/.test(item.code) || !item.region || !item.currency) throw new Error('Complete the country name, two-letter code, region and currency.');
  const records = snapshot();
  if (records.some(country => country.id !== item.id && (country.name.toLowerCase() === item.name.trim().toLowerCase() || country.code === item.code))) throw new Error('This country or country code already exists.');
  const next = records.some(country => country.id === item.id) ? records.map(country => country.id === item.id ? item : country) : [...records, item];
  const raw = JSON.stringify(next); localStorage.setItem(KEY, raw); cachedRaw = raw; cache = next; window.dispatchEvent(new Event(EVENT));
}
