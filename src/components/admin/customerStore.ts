'use client';
import { useMemo, useSyncExternalStore } from 'react';
import { customerRecord, initialCustomers, type AdminCustomer } from '@/data/admin/customers';
import { useApplications } from './applicationStore';
import { useCompanies } from './companyStore';
const KEY = 'registat:admin:customers:v1';
const EVENT = 'registat:admin:customers-changed';
let rawCache: string | null | undefined;
let cache = initialCustomers;
function snapshot() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== rawCache) {
      const parsed = raw ? JSON.parse(raw) : null;
      cache = Array.isArray(parsed) && parsed.every(item => typeof item.id === 'string' && typeof item.email === 'string' && Array.isArray(item.notes) && Array.isArray(item.events)) ? parsed : initialCustomers;
      rawCache = raw;
    }
  } catch { /* Retain the last usable snapshot. */ }
  return cache;
}
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback); window.addEventListener('storage', callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener('storage', callback); };
}
export function useCustomers() {
  const records = useSyncExternalStore(subscribe, snapshot, () => initialCustomers);
  const applications = useApplications();
  const companies = useCompanies();
  return useMemo(() => {
    const result = new Map(records.map(record => [record.email.toLowerCase(), record]));
    companies.forEach(company => {
      const key = company.owner.email.toLowerCase();
      if (!result.has(key)) result.set(key, customerRecord(company.owner, company.owner.id, company.registrationDate));
    });
    applications.forEach(app => {
      const key = app.customer.email.toLowerCase();
      if (!result.has(key)) result.set(key, customerRecord(app.customer, `email-${encodeURIComponent(key)}`, app.submitted));
    });
    return [...result.values()];
  }, [records, applications, companies]);
}
export function saveCustomer(customer: AdminCustomer) {
  const records = snapshot();
  if (records.some(record => record.id !== customer.id && record.email.toLowerCase() === customer.email.toLowerCase())) throw new Error('A customer with this email address already exists.');
  const next = records.some(record => record.id === customer.id) ? records.map(record => record.id === customer.id ? customer : record) : [customer, ...records];
  const raw = JSON.stringify(next);
  localStorage.setItem(KEY, raw); rawCache = raw; cache = next;
  window.dispatchEvent(new Event(EVENT));
}
