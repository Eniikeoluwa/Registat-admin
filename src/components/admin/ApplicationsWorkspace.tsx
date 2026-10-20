"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { applicationJurisdictions, applicationServices, applicationStatuses, displayDate, jurisdictionFlags, type AdminApplication } from "@/data/admin/applications";
import { SmallIcon, StatusBadge } from "./ApplicationUI";
import ApplicationDrawer from "./ApplicationDrawer";
import NewApplicationModal from "./NewApplicationModal";
import { useApplications } from "./applicationStore";

const PAGE_SIZE = 6;
const slug = (value: string) => value.toLowerCase().replaceAll(" ", "-");

export default function ApplicationsWorkspace() {
  const applications = useApplications();
  const router = useRouter();
  const pathname = usePathname();
  const segment = pathname.split("/")[3];
  const create = segment === "new";
  const reference = segment && !create ? decodeURIComponent(segment) : undefined;
  const search = useSearchParams();
  const statusQuery = search.get("status") ?? "all";
  const activeStatus = statusQuery === "action-required" ? "Under Review" : statusQuery === "new" ? "In Progress" : applicationStatuses.find((status) => slug(status) === statusQuery) ?? "All";
  const taskQuery = search.get("task");
  const [query, setQuery] = useState("");
  const [service, setService] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const selectedApplication = applications.find((item) => item.reference === reference);
  const filterQuery = query.trim().toLowerCase();
  const filtered = applications.filter((app) =>
    (activeStatus === "All" || app.status === activeStatus) &&
    (!service || app.service === service) && (!jurisdiction || app.jurisdiction === jurisdiction) &&
    (!filterQuery || [app.reference, app.customer.name, app.customer.email, app.companyName, app.service].join(" ").toLowerCase().includes(filterQuery)) &&
    (!startDate || app.submitted.slice(0, 10) >= startDate) && (!endDate || app.submitted.slice(0, 10) <= endDate) &&
    (taskQuery !== "review-documents" || app.documents.some((doc) => doc.state === "Pending"))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allChecked = rows.length > 0 && rows.every((app) => selected.has(app.reference));
  const listingPath = `/admin/applications${search.toString() ? `?${search}` : ""}`;

  function openApplication(value: string) { router.push(`/admin/applications/${encodeURIComponent(value)}${search.toString() ? `?${search}` : ""}`, { scroll: false }); }
  function setStatus(value: string) {
    const params = new URLSearchParams(search.toString()); params.delete("task");
    if (value === "All") params.delete("status"); else params.set("status", slug(value));
    setPage(1); router.replace(`${reference ? `/admin/applications/${reference}` : "/admin/applications"}${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  function exportRows() {
    const records = selected.size ? filtered.filter((app) => selected.has(app.reference)) : filtered;
    if (!records.length) { setNotice("No matching applications to export."); return; }
    const cell = (value: string) => `"${(/^[=+@\-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
    const csv = [["Reference", "Customer", "Email", "Service", "Jurisdiction", "Status", "Date submitted"], ...records.map((app) => [app.reference, app.customer.name, app.customer.email, app.service, app.jurisdiction, app.status, displayDate(app.submitted)])].map((row) => row.map(cell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "registat-applications.csv"; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${records.length} application${records.length === 1 ? "" : "s"}.`);
  }

  return <div className={`applications-workspace ${reference ? "has-drawer" : ""}`}>
    <section className="applications-main" aria-label="Applications workspace">
      <header className="applications-page-header"><div><h1>Applications</h1><p>Manage and track all registration and compliance applications.</p></div><Link className="application-button primary" href="/admin/applications/new" scroll={false}><SmallIcon name="plus" />New application</Link></header>
      <div className="applications-status-tabs" aria-label="Filter applications by status">{["All", ...applicationStatuses].map((status) => <button key={status} aria-pressed={activeStatus === status} onClick={() => setStatus(status)}>{status} ({status === "All" ? applications.length : applications.filter((app) => app.status === status).length})</button>)}</div>
      <div className="applications-filters"><div className="application-search-input"><SmallIcon name="search" /><input aria-label="Search applications" placeholder="Search…" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div><div className="applications-filter-controls"><select aria-label="Filter by service" value={service} onChange={(event) => { setService(event.target.value); setPage(1); }}><option value="">All services</option>{applicationServices.map((name) => <option key={name}>{name}</option>)}</select><select aria-label="Filter by jurisdiction" value={jurisdiction} onChange={(event) => { setJurisdiction(event.target.value); setPage(1); }}><option value="">All jurisdictions</option>{applicationJurisdictions.map((name) => <option key={name}>{name}</option>)}</select><select aria-label="Filter by status" value={activeStatus} onChange={(event) => setStatus(event.target.value)}><option value="All">All statuses</option>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select><details className="applications-date-filter"><summary><SmallIcon name="calendar" />{startDate || endDate ? "Date range selected" : "Select date range"}</summary><div><FieldDate label="From date" value={startDate} max={endDate} onChange={(value) => { setStartDate(value); setPage(1); }} /><FieldDate label="To date" value={endDate} min={startDate} onChange={(value) => { setEndDate(value); setPage(1); }} /><button onClick={() => { setStartDate(""); setEndDate(""); }}>Clear dates</button></div></details><details className="applications-more"><summary aria-label="More application actions">···</summary><div><button onClick={exportRows}>Export {selected.size ? "selected" : "applications"}</button><button onClick={() => { setQuery(""); setService(""); setJurisdiction(""); setStartDate(""); setEndDate(""); setStatus("All"); setSelected(new Set()); }}>Clear filters and selection</button></div></details></div></div>
      {notice && <p className="application-inline-message" role="status">{notice}<button aria-label="Dismiss table notification" onClick={() => setNotice("")}>×</button></p>}
      {taskQuery === "review-documents" && <p className="application-inline-message">Showing applications with documents to review. <button onClick={() => setStatus("All")}>Clear</button></p>}
      <div className="applications-table-card"><div className="applications-table-scroll"><table className="applications-table"><colgroup><col className="application-check-column" /><col /><col /><col /><col className="application-jurisdiction-column" /><col className="application-status-column" /><col className="application-date-column" /></colgroup><thead><tr><th><input type="checkbox" aria-label="Select all applications on this page" checked={allChecked} ref={(element) => { if (element) element.indeterminate = !allChecked && rows.some((app) => selected.has(app.reference)); }} onChange={(event) => { const checked = event.target.checked; setSelected((current) => { const next = new Set(current); rows.forEach((app) => checked ? next.add(app.reference) : next.delete(app.reference)); return next; }); }} /></th>{["Reference no.", "Customer", "Service", "Jurisdiction", "Status", "Date submitted"].map((name) => <th key={name} scope="col">{name}</th>)}</tr></thead><tbody>{rows.map((app) => <ApplicationRow key={app.reference} application={app} active={app.reference === reference} checked={selected.has(app.reference)} onOpen={() => openApplication(app.reference)} onCheck={() => setSelected((current) => { const next = new Set(current); if (next.has(app.reference)) next.delete(app.reference); else next.add(app.reference); return next; })} />)}</tbody></table>{!rows.length && <div className="applications-empty"><SmallIcon name="search" /><h2>No applications found</h2><p>Try a different search or adjust your filters.</p></div>}</div><footer className="applications-pagination"><p>{selected.size ? `${selected.size} selected · ` : ""}Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0} to {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} applications</p><div><button aria-label="Previous applications page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span aria-current="page">{currentPage}</span><button aria-label="Next applications page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>›</button></div></footer></div>
    </section>
    {selectedApplication && <ApplicationDrawer key={selectedApplication.reference} application={selectedApplication} onClose={() => router.push(listingPath, { scroll: false })} />}
    {reference && !selectedApplication && <aside className="application-drawer application-missing"><h2>Application unavailable</h2><p>This reference is not available in this browser.</p><Link className="application-button" href="/admin/applications">Back to applications</Link></aside>}
    {create && <NewApplicationModal onClose={() => router.push(listingPath, { scroll: false })} onView={openApplication} />}
  </div>;
}

function FieldDate({ label, value, min, max, onChange }: { label: string; value: string; min?: string; max?: string; onChange: (value: string) => void }) {
  return <label>{label}<input type="date" value={value} min={min || undefined} max={max || undefined} onChange={(event) => onChange(event.target.value)} /></label>;
}

function ApplicationRow({ application: app, active, checked, onOpen, onCheck }: { application: AdminApplication; active: boolean; checked: boolean; onOpen: () => void; onCheck: () => void }) {
  return <tr className={active ? "is-selected" : ""} onClick={onOpen} onKeyDown={(event) => { if (event.target === event.currentTarget && event.key === "Enter") onOpen(); }}><td onClick={(event) => event.stopPropagation()}><input type="checkbox" aria-label={`Select ${app.reference}`} checked={checked} onChange={onCheck} /></td><td><button onClick={(event) => { event.stopPropagation(); onOpen(); }} aria-label={`Open application ${app.reference}`}>{app.reference}</button><small>{app.service}</small></td><td><strong>{app.customer.name}</strong><small>{app.customer.email}</small></td><td><span>{app.service}</span><small>{app.entityType}</small></td><td><span className="application-country-flag">{jurisdictionFlags[app.jurisdiction]}</span>{app.jurisdiction}</td><td><StatusBadge status={app.status} /></td><td>{displayDate(app.submitted)}<small>{displayDate(app.submitted, true)}</small></td></tr>;
}
