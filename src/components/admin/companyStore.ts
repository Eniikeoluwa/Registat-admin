'use client';
import { useSyncExternalStore } from 'react';
import { initialCompanies, type AdminCompany } from '@/data/admin/companies';
const KEY = 'registat:admin:companies:v1';
const EVENT = 'registat:admin:companies-changed';
let cachedRaw: string | null | undefined;
let cache = initialCompanies;
function snapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      const parsed = raw ? JSON.parse(raw) : null;
      cache = Array.isArray(parsed) && parsed.every(item => typeof item.id === 'string' && typeof item.name === 'string' && item.owner && Array.isArray(item.documents) && Array.isArray(item.people) && Array.isArray(item.events) && Array.isArray(item.filings) && Array.isArray(item.invoices)) ? parsed : initialCompanies;
      cachedRaw = raw;
    }
  } catch { /* Retain the last usable snapshot. */ }
  return cache;
}
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}
export function useCompanies() { return useSyncExternalStore(subscribe, snapshot, () => initialCompanies); }
export function saveCompany(company: AdminCompany) {
  if (!company.name.trim() || !company.rc.trim() || !company.owner.id || !Number.isFinite(Date.parse(company.registrationDate))) throw new Error('Enter a company name, RC number, owner, and valid registration date before saving.');
  const records = snapshot();
  if (records.some(item => item.id !== company.id && item.rc.toLowerCase().replace(/\s/g, '') === company.rc.toLowerCase().replace(/\s/g, ''))) throw new Error('A company with this RC number already exists.');
  const next = records.some(item => item.id === company.id) ? records.map(item => item.id === company.id ? company : item) : [company, ...records];
  const raw = JSON.stringify(next); localStorage.setItem(KEY, raw); cachedRaw = raw; cache = next;
  window.dispatchEvent(new Event(EVENT));
}
export function companyEvent(title: string, description: string) { return { id: crypto.randomUUID(), title, description, date: new Date().toISOString() }; }
