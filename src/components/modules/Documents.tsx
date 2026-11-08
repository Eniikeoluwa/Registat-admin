"use client";
import { useState, type FormEvent } from "react";
import { api, useApi } from "@/lib/api/client";
import type { AdminStoredDocumentResponse, DocumentAccessResponse } from "@/lib/api/types";
import { can } from "@/lib/auth/permissions";
import { useAccount } from "@/components/auth/AccountIdentity";
import { Empty, LoadState, Status, buttonClass, inputClass, panelClass } from "@/components/applications/UI";
import { Pagination } from "./ModuleUI";
import RecordLookup from "./RecordLookup";
import { ActionForm } from "./ApiControls";
export function DocumentAccess({ id }: { id: string }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [url, setUrl] = useState("");
  async function open() {
    setBusy(true); setError(""); setUrl("");
    try { const response = await api<DocumentAccessResponse>(`documents/admin/${id}/access-url`); const parsed = new URL(response.data.url); if (parsed.protocol !== "https:") throw new Error("The document link is invalid."); setUrl(parsed.href); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to access document."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" className="text-[#067939] underline" disabled={busy} onClick={() => void open()}>{busy ? "Preparing…" : "Get secure document link"}</button>{url && <a className="ml-3 text-[#067939] underline" href={url} target="_blank" rel="noopener noreferrer">Open document ↗</a>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>;
}
export function DocumentDelivery({ userId = "", applicationId = "", companyId = "", onSaved }: { userId?: string; applicationId?: string; companyId?: string; onSaved?: () => void }) {
  const [customer, setCustomer] = useState(userId); const [application, setApplication] = useState(applicationId); const [company, setCompany] = useState(companyId);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    for (const [key, value] of Array.from(form.entries())) if (value === "") form.delete(key);
    setBusy(true); setError(""); setMessage("");
    try { await api("documents/admin/upload", { method: "POST", body: form }); setMessage("Document delivered to the customer."); onSaved?.(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  return <details className={panelClass}><summary className="cursor-pointer font-semibold">Deliver official document</summary><form onSubmit={event => void submit(event)} className="mt-4 space-y-4"><input type="hidden" name="userId" value={customer} /><input type="hidden" name="applicationId" value={application} /><input type="hidden" name="companyId" value={company} />{!userId && <RecordLookup field="userId" value={customer} onChange={value => { setCustomer(String(value || "")); setApplication(""); setCompany(""); }} disabled={busy} />}{!applicationId && <RecordLookup field="applicationId" value={application} onChange={value => setApplication(String(value || ""))} disabled={busy} scope={{ userId: customer }} />}{!companyId && <RecordLookup field="companyId" value={company} onChange={value => setCompany(String(value || ""))} disabled={busy} scope={{ userId: customer }} />}{userId && <p className="text-sm text-slate-500">Delivery is scoped to this customer{applicationId ? " and application" : ""}{companyId ? " and company" : ""}.</p>}<label className="block text-sm">Category<input required name="category" placeholder="e.g. certificate" pattern="[a-z0-9]+(?:_[a-z0-9]+)*" maxLength={100} className={inputClass} /></label><label className="block text-sm">Document (image or PDF, up to 20 MB)<input required name="file" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml,application/pdf" className={inputClass} /></label><button className={buttonClass} disabled={busy}>{busy ? "Uploading…" : "Deliver document"}</button>{message && <p role="status">{message}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}</form></details>;
}
export default function Documents({ applicationId, userId, companyId }: { applicationId?: string; userId?: string; companyId?: string }) {
  const account = useAccount(); const [page, setPage] = useState(1); const [filters, setFilters] = useState<Record<string, string>>({});
  const query = new URLSearchParams({ ...filters, page: String(page), limit: "20", ...(applicationId ? { applicationId } : {}), ...(userId ? { userId } : {}), ...(companyId ? { companyId } : {}) });
  const resource = useApi<AdminStoredDocumentResponse[]>(can(account, "documents:read") ? `documents/admin?${query}` : null);
  if (!can(account, "documents:read")) return null;
  return <section className="space-y-5"><h2 className="text-xl font-bold">Documents</h2><div className="flex flex-wrap gap-4">{[["direction", ["uploaded", "received"]], ["reviewStatus", ["pending", "approved", "rejected"]]].map(([key, options]) => <label key={String(key)} className="text-sm">{key === "direction" ? "Direction" : "Review status"}<select className={inputClass} value={filters[String(key)] || ""} onChange={event => { setPage(1); setFilters({ ...filters, [String(key)]: event.target.value }); }}><option value="">All</option>{(options as string[]).map(option => <option key={option}>{option}</option>)}</select></label>)}</div>{can(account, "documents:write") && <DocumentDelivery userId={userId} applicationId={applicationId} companyId={companyId} onSaved={resource.reload} />}<LoadState {...resource} retry={resource.reload} />{resource.data?.map(document => <article className={`${panelClass} space-y-3`} key={document._id}><div className="flex flex-wrap justify-between gap-3"><strong>{document.originalFileName}</strong><Status value={document.reviewStatus || "pending"} /></div><p className="text-sm text-slate-500">{document.category} · {document.userInfo.name} · {Math.ceil(document.bytes / 1024)} KB · {document.source === "admin_delivery" ? "Received by customer" : "Uploaded by customer"}</p>{document.reviewMessage && <p className="text-sm">{document.reviewMessage}</p>}<DocumentAccess id={document._id} />{can(account, "documents:write") && document.source !== "admin_delivery" && <ActionForm title="Review document" schema="ReviewDocument" endpoint={`documents/admin/${document._id}/review`} method="PATCH" onSaved={resource.reload} description="Rejecting an application document requests a replacement from the customer." />}</article>)}{resource.data?.length === 0 && <Empty title="No documents" description="Uploaded and delivered documents will appear here." />}<Pagination value={resource.pagination} onPage={setPage} /></section>;
}
