"use client";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PaginationMetaResponse } from "@/lib/api/types";
import { inputClass } from "@/components/applications/UI";
export function useFilters() {
  const search = useSearchParams(); const pathname = usePathname(); const router = useRouter();
  function update(values: Record<string, string>) { const query = new URLSearchParams(search.toString()); for (const [key, value] of Object.entries(values)) { if (value) query.set(key, value); else query.delete(key); } if (!("page" in values)) query.delete("page"); router.replace(`${pathname}${query.size ? `?${query}` : ""}`); }
  return { search, pathname, update, reset: () => router.replace(pathname) };
}
export function Pagination({ value, onPage }: { value?: PaginationMetaResponse; onPage: (page: number) => void }) { if (!value) return null; return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm text-slate-600"><span>{value.total} results · Page {value.page} of {Math.max(1, value.totalPages)}</span><div className="flex gap-3"><button className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40" disabled={!value.hasPreviousPage} onClick={() => onPage(value.page - 1)}>Previous</button><button className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40" disabled={!value.hasNextPage} onClick={() => onPage(value.page + 1)}>Next</button></div></nav>; }
export function Search({ value, onSearch, placeholder = "Search…" }: { value?: string; onSearch: (value: string) => void; placeholder?: string }) { return <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); onSearch(String(form.get("search") || "").trim()); }} className="flex gap-3"><input key={value} name="search" defaultValue={value} maxLength={100} aria-label={placeholder} placeholder={placeholder} className={inputClass} /><button className="rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold">Search</button></form>; }
export function DataView({ data }: { data: unknown }) {
  if (data === null || data === undefined || data === "") return <span className="text-slate-400">Not provided</span>;
  if (typeof data === "boolean") return <span>{data ? "Yes" : "No"}</span>;
  if (Array.isArray(data)) return data.length ? <div className="space-y-3">{data.map((item, index) => <div key={index} className="rounded-lg bg-slate-50 p-3"><DataView data={item} /></div>)}</div> : <span className="text-slate-400">None</span>;
  if (typeof data === "object") return <dl className="space-y-3">{Object.entries(data).filter(([key]) => !["_id", "__v", "ownerUserId", "createdBy", "updatedBy"].includes(key)).map(([key, value]) => <div key={key}><dt className="text-xs font-semibold capitalize text-slate-500">{key.replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ")}</dt><dd className="mt-1 break-words text-sm"><DataView data={value} /></dd></div>)}</dl>;
  return <span>{String(data)}</span>;
}
export function money(amount: number, currency = "USD") { return new Intl.NumberFormat("en", { style: "currency", currency }).format(amount / 100); }
