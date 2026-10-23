"use client";
import Link from "next/link";
import { useState } from "react";
import { api, useApi } from "@/lib/api/client";
import type { PaymentResponse, AdminUserResponse, AdminCompanyResponse } from "@/lib/api/types";
import { Empty, LoadState, Status, buttonClass, inputClass, panelClass, date } from "@/components/applications/UI";
import { DataView, Pagination, money, useFilters } from "./ModuleUI";

type AdminPayment = PaymentResponse & { userInfo: Pick<AdminUserResponse, "_id" | "name" | "email" | "phone" | "role">; companyInfo?: Pick<AdminCompanyResponse, "_id" | "name">; domain: "test" | "live"; providerTransactionId?: string; lastVerifiedAt?: string };
const statuses = ["initializing", "pending", "success", "failed", "abandoned", "reversed", "review_required"];
export function Payments() {
  const filters = useFilters();
  const query = new URLSearchParams(filters.search.toString()); query.set("limit", "20");
  const resource = useApi<AdminPayment[]>(`payments/admin?${query}`);
  return <main className="mx-auto max-w-7xl space-y-5 p-5 sm:p-8"><header><h1 className="text-3xl font-bold">Payments</h1><p className="mt-2 text-sm text-slate-500">Live payment records across customer accounts. Amounts show the actual charge currency.</p></header><div className="grid gap-4 sm:grid-cols-4"><label>Status<select className={inputClass} value={filters.search.get("status") || ""} onChange={event => filters.update({ status: event.target.value })}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label><label>Currency<select className={inputClass} value={filters.search.get("currency") || ""} onChange={event => filters.update({ currency: event.target.value })}><option value="">All currencies</option><option>USD</option><option>NGN</option></select></label>{["userId", "applicationId"].map(key => <label key={key}>{key === "userId" ? "Customer ID" : "Application ID"}<input className={inputClass} value={filters.search.get(key) || ""} onChange={event => filters.update({ [key]: event.target.value })} /></label>)}</div><button className="text-sm text-[#067939] underline" onClick={filters.reset}>Clear filters</button><LoadState {...resource} retry={resource.reload} />{resource.data?.map(payment => <article key={payment._id} className={panelClass}><div className="flex flex-wrap justify-between gap-3"><Link className="break-all font-semibold text-[#067939]" href={`/admin/payments/${payment.reference}`}>{payment.reference} →</Link><Status value={payment.status} /></div><p className="mt-3">{money(payment.amountMinor, payment.currency)} · {payment.userInfo.name}</p><p className="mt-2 text-sm text-slate-500">{date(payment.createdAt)} · {payment.domain} mode{payment.companyInfo ? ` · ${payment.companyInfo.name}` : ""}</p></article>)}{resource.data?.length === 0 && <Empty title="No payments found" description="Try changing your filters." />}<Pagination value={resource.pagination} onPage={page => filters.update({ page: String(page) })} /><p className="text-sm text-slate-500">Invoices, refunds and manual payment recording are unavailable in the current API.</p></main>;
}
export function PaymentDetail({ reference }: { reference: string }) {
  const resource = useApi<AdminPayment>(`payments/admin/${encodeURIComponent(reference)}`);
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  async function verify() {
    setBusy(true); setMessage(""); setError("");
    try { const result = await api<AdminPayment>(`payments/admin/${encodeURIComponent(reference)}/verify`, { method: "POST" }); setMessage(`Provider verification finished. Payment status: ${result.data.status}.`); resource.reload(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to verify payment."); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8"><Link className="text-[#067939]" href="/admin/payments">← All payments</Link><h1 className="break-all text-2xl font-bold">{reference}</h1><LoadState {...resource} retry={resource.reload} />{resource.data && <><section className={panelClass}><Status value={resource.data.status} /><p className="my-4 text-2xl font-semibold">{money(resource.data.amountMinor, resource.data.currency)}</p><DataView data={resource.data} /></section><Link className="text-[#067939]" href={`/admin/applications/${resource.data.applicationId}`}>View application →</Link><p className="text-sm text-slate-500">Verify the stored payment against the provider. Verification does not initiate a new charge; a successful request can still return a pending or failed payment status.</p><button disabled={busy} className={buttonClass} onClick={() => void verify()}>{busy ? "Verifying…" : "Verify with payment provider"}</button></>}{message && <p role="status">{message}</p>}{error && <p role="alert" className="text-red-700">{error}</p>}</main>;
}
