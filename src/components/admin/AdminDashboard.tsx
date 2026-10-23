"use client";

import Link from "next/link";
import { useAccount } from "@/components/auth/AccountIdentity";
import { useApi } from "@/lib/api/client";
import type { AdminApplicationResponse } from "@/lib/api/types";
import { Empty, LoadState, Status, date, panelClass } from "@/components/applications/UI";

function ApplicationCount({ title, status }: { title: string; status?: string }) {
  const resource = useApi<AdminApplicationResponse[]>(`applications/admin?limit=1${status ? `&status=${status}` : ""}`);
  return <Link className="admin-summary-card" href={`/admin/applications${status ? `?status=${status}` : ""}`}><h2>{title}</h2><strong>{resource.loading ? "…" : resource.pagination?.total ?? "—"}</strong>{resource.error && <p role="alert">{resource.error}</p>}</Link>;
}
export default function AdminDashboard() {
  const account = useAccount();
  const recent = useApi<AdminApplicationResponse[]>("applications/admin?limit=5");
  return <div className="admin-dashboard">
    <div className="admin-greeting"><div><h1>Welcome, {account?.name}</h1><p>Live application overview across Registat.</p></div><Link className="admin-button primary" href="/admin/applications/new">New application</Link></div>
    <section className="admin-summary" aria-label="Application overview"><ApplicationCount title="Total applications" /><ApplicationCount title="Pending" status="pending" /><ApplicationCount title="Under review" status="under_review" /><ApplicationCount title="Action required" status="action_required" /><ApplicationCount title="Completed" status="completed" /></section>
    <section className={panelClass}><h2 className="text-xl font-semibold">Quick actions</h2><div className="mt-4 flex flex-wrap gap-5 text-[#067939]">{[["Review applications", "applications"], ["View customers", "customers"], ["View companies", "companies"], ["Review payments", "payments"], ["Manage services", "services"], ["Manage jurisdictions", "jurisdictions"]].map(([title, path]) => <Link key={path} href={`/admin/${path}`}>{title} →</Link>)}</div></section>
    <section className={`${panelClass} mt-6`}><div className="flex justify-between gap-3"><h2 className="text-xl font-semibold">Recent applications</h2><Link className="text-[#067939]" href="/admin/applications">View all →</Link></div><LoadState {...recent} retry={recent.reload} />{recent.data?.map(application => <Link className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4" key={application._id} href={`/admin/applications/${application._id}`}><div><strong>{application.reference}</strong><p className="text-sm text-slate-500">{application.userInfo.name} · {application.serviceName} · {date(application.createdAt)}</p></div><Status value={application.status} /></Link>)}{recent.data?.length === 0 && <Empty title="No applications yet" description="New applications will appear here." />}</section>
  </div>;
}
