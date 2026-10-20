'use client';
import { useSyncExternalStore } from 'react';
import { initialServices, validateService, type AdminService } from '@/data/admin/services';
const KEY = 'registat:admin:services:v1';
const EVENT = 'registat:admin:services-changed';
let cachedRaw: string | null | undefined;
let cache = initialServices;
function snapshot(): AdminService[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      cache = Array.isArray(parsed) && parsed.every(item => item && typeof item.id === 'string' && Array.isArray(item.entities) && Array.isArray(item.addons)) ? parsed : initialServices;
      cachedRaw = raw;
    }
  } catch { /* Keep last usable records. */ }
  return cache;
}
function subscribe(callback: () => void) { window.addEventListener(EVENT, callback); window.addEventListener('storage', callback); return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); }; }
export function useServices() { return useSyncExternalStore(subscribe, snapshot, () => initialServices); }
export function getService(id: string) { return snapshot().find(service => service.id === id); }
export function saveService(service: AdminService) {
  validateService(service);
  const records = snapshot();
  if (records.some(item => item.id !== service.id && item.name.trim().toLowerCase() === service.name.trim().toLowerCase())) throw new Error('A service with this name already exists.');
  const next = records.some(item => item.id === service.id) ? records.map(item => item.id === service.id ? service : item) : [service, ...records];
  const raw = JSON.stringify(next); localStorage.setItem(KEY, raw); cachedRaw = raw; cache = next; window.dispatchEvent(new Event(EVENT));
}
