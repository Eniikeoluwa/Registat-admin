"use client";

import { useSyncExternalStore } from "react";
import { initialApplications, type AdminApplication } from "@/data/admin/applications";

const STORAGE_KEY = "registat:admin:applications:v1";
const EVENT = "registat:admin:applications-changed";
let cachedRaw: string | null | undefined;
let cachedApplications = initialApplications;

function getSnapshot() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.every((item) => item && typeof item.reference === "string" && item.customer && Array.isArray(item.documents) && Array.isArray(item.notes))) cachedApplications = [...parsed, ...initialApplications.filter(seed => !parsed.some(item => item.reference === seed.reference))];
      else cachedApplications = initialApplications;
    }
  } catch { /* Keep in-memory records when browser storage is unavailable. */ }
  return cachedApplications;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener(EVENT, callback); window.removeEventListener("storage", callback); };
}

export function useApplications() { return useSyncExternalStore(subscribe, getSnapshot, () => initialApplications); }

export function saveApplication(application: AdminApplication) {
  const current = getSnapshot();
  const exists = current.some((item) => item.reference === application.reference);
  const next = exists ? current.map((item) => item.reference === application.reference ? application : item) : [application, ...current];
  // A failed write is surfaced to the form so it never claims a failed save succeeded.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  cachedRaw = JSON.stringify(next);
  cachedApplications = next;
  window.dispatchEvent(new Event(EVENT));
}

export function nextApplicationReference() {
  const highest = getSnapshot().reduce((max, app) => {
    const match = app.reference.match(/^REG-2026-(\d{5})$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 127);
  return `REG-2026-${String(highest + 1).padStart(5, "0")}`;
}

function openDocumentsDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("registat-admin-documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("Document storage is unavailable. Please try again."));
  });
}

export async function saveDocumentFiles(files: { key: string; file: File }[]) {
  if (!files.length) return;
  const db = await openDocumentsDatabase();
  try { await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("files", "readwrite");
    files.forEach(({ key, file }) => transaction.objectStore("files").put(file, key));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error("Could not save the selected documents."));
    transaction.onabort = () => reject(new Error("Document save was interrupted."));
  }); } finally { db.close(); }
}

export async function downloadDocument(key: string, filename: string) {
  const db = await openDocumentsDatabase();
  try {
    const file = await new Promise<Blob | undefined>((resolve, reject) => {
      const request = db.transaction("files").objectStore("files").get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error("Could not read this document."));
    });
    if (!file) throw new Error("This document was marked as received; no file is stored in this browser.");
    const url = URL.createObjectURL(file);
    const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally { db.close(); }
}
