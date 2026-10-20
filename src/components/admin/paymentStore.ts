'use client';
import { useSyncExternalStore } from 'react';
import { initialInvoices, validateInvoice, type AdminInvoice } from '@/data/admin/payments';
const KEY = 'registat:admin:invoices:v1'; const EVENT = 'registat:admin:invoices-changed';
let cachedRaw: string | null | undefined; let cache = initialInvoices;
function snapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cachedRaw) { const parsed = raw ? JSON.parse(raw) : null; cache = Array.isArray(parsed) && parsed.every(item => typeof item.id === 'string' && typeof item.number === 'string' && Array.isArray(item.lines) && Array.isArray(item.receipts) && Array.isArray(item.events)) ? parsed : initialInvoices; cachedRaw = raw; }
  } catch { /* Keep the last usable snapshot. */ }
  return cache;
}
function subscribe(callback: () => void) { window.addEventListener(EVENT, callback); window.addEventListener('storage', callback); return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); }; }
export function useInvoices() { return useSyncExternalStore(subscribe, snapshot, () => initialInvoices); }
export function getInvoice(id: string) { return snapshot().find(invoice => invoice.id === id); }
export function saveInvoice(invoice: AdminInvoice) {
  validateInvoice(invoice); const records = snapshot();
  if (records.some(item => item.id !== invoice.id && item.number.toLowerCase() === invoice.number.trim().toLowerCase())) throw new Error('This invoice number is already in use.');
  const next = records.some(item => item.id === invoice.id) ? records.map(item => item.id === invoice.id ? invoice : item) : [invoice, ...records];
  const raw = JSON.stringify(next); localStorage.setItem(KEY, raw); cachedRaw = raw; cache = next; window.dispatchEvent(new Event(EVENT));
}
export function nextInvoiceNumber(records = snapshot()) { const year = new Date().getFullYear(); const prefix = `INV-${year}-`; const max = records.reduce((highest, item) => item.number.startsWith(prefix) ? Math.max(highest, Number(item.number.slice(prefix.length)) || 0) : highest, 123); return `${prefix}${String(max + 1).padStart(4, '0')}`; }
