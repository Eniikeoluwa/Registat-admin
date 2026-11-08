"use client";
import { useState, type ReactNode } from "react";
import { useAccount } from "@/components/auth/AccountIdentity";
import { can } from "@/lib/auth/permissions";
import { api, useApi } from "@/lib/api/client";
import { Empty, LoadState, buttonClass, panelClass } from "@/components/applications/UI";
import { DataView, Pagination } from "./ModuleUI";
import SchemaEditor, { type OptionsMap } from "./SchemaEditor";
export function Permit({ permission, children }: { permission: string; children: ReactNode }) {
  return can(useAccount(), permission) ? children : null;
}
export function ActionForm({ title, schema, endpoint, method = "POST", initial, optionsMap, onSaved, description, scope }: { title: string; schema: string; endpoint: string; method?: string; initial?: unknown; optionsMap?: OptionsMap; onSaved?: (value: Record<string, unknown>) => void; description?: string; scope?: Record<string, unknown> }) {
  const [open, setOpen] = useState(false); const [message, setMessage] = useState("");
  return <div className="space-y-3">{message && <p role="status" className="text-sm text-green-800">{message}</p>}{open ? <SchemaEditor title={title} schemaName={schema} endpoint={endpoint} method={method} initial={initial} optionsMap={optionsMap} scope={scope} description={description} onCancel={() => setOpen(false)} onSaved={value => { setOpen(false); setMessage("Changes saved."); onSaved?.(value); }} /> : <button type="button" className="admin-button" onClick={() => { setMessage(""); setOpen(true); }}>{title}</button>}</div>;
}
export function ActionButton({ title, endpoint, method = "POST", body, onSaved, confirmation }: { title: string; endpoint: string; method?: string; body?: unknown; onSaved?: () => void; confirmation?: string }) {
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [confirm, setConfirm] = useState(false);
  async function run() {
    setBusy(true); setMessage(""); setError("");
    try { const response = await api(endpoint, { method, body }); setMessage(response.message || "Request completed."); setConfirm(false); onSaved?.(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Request failed."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-2">{confirm ? <div className={`${panelClass} space-y-3`}><p>{confirmation}</p><button disabled={busy} className={buttonClass} onClick={() => void run()}>Confirm</button><button disabled={busy} className="ml-4 underline" onClick={() => setConfirm(false)}>Cancel</button></div> : <button disabled={busy} className="admin-button" onClick={() => confirmation ? setConfirm(true) : void run()}>{busy ? "Please wait…" : title}</button>}{message && <p role="status" className="text-sm text-green-800">{message}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}{/fresh|recent|log.?in|re.?auth/i.test(error) && <a className="ml-2 underline" href={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>Log in again</a>}</p>}</div>;
}
export function RemoteRecords({ title, endpoint, render }: { title: string; endpoint: string; render?: (value: Record<string, unknown>) => ReactNode }) {
  const [page, setPage] = useState(1);
  const resource = useApi<Record<string, unknown>[]>(`${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}&limit=10`);
  // A new revision remounts this component at its call site, preserving independent pagination.
  return <section className={`${panelClass} space-y-4`}><h2 className="text-lg font-bold">{title}</h2><LoadState {...resource} retry={resource.reload} />{resource.data?.map((value, index) => <article className="border-t border-slate-100 py-4" key={String(value._id || index)}>{render ? render(value) : <DataView data={value} />}</article>)}{resource.data?.length === 0 && <Empty title={`No ${title.toLowerCase()}`} description="New records will appear here." />}<Pagination value={resource.pagination} onPage={setPage} /></section>;
}
