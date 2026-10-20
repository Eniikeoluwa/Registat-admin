"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { activities, jurisdictions, pendingTasks, serviceBreakdown, summaryCards } from "@/data/admin/dashboard";
import AdminAsset from "./AdminAsset";
import AdminTaskTable from "./AdminTaskTable";

function PeriodPicker({ title }: { title: string }) {
  // Reference data currently covers this month; do not fabricate other periods.
  return <details className="admin-dropdown admin-period"><summary>This month<AdminAsset name="smallDown" /></summary><div className="admin-dropdown-panel"><strong>{title}</strong><p>This month is the available reporting period.</p></div></details>;
}

function PanelHeading({ title, period, count, children }: { title: string; period?: boolean; count?: number; children?: React.ReactNode }) {
  return <div className="admin-panel-heading"><h2>{title}{count !== undefined && <span className="admin-count">{count}</span>}</h2>{period ? <PeriodPicker title={title} /> : children}</div>;
}

export default function AdminDashboard() {
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(pendingTasks[0].reference);
  const [assignee, setAssignee] = useState("John Adeyemi");
  const [notice, setNotice] = useState("");
  const assignmentDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (assignOpen) assignmentDialog.current?.showModal();
    else assignmentDialog.current?.close();
  }, [assignOpen]);

  return <div className="admin-dashboard">
    <div className="admin-greeting">
      <div><h1>Good morning, Admin</h1><p>Here&apos;s what&apos;s happening across Registat today.</p></div>
      <div className="admin-greeting-actions"><Link className="admin-button primary" href="/admin/applications/new">New Application</Link><button className="admin-button" onClick={() => setAssignOpen(true)}>Assign application</button><a href="#recent-activity" aria-label="View recent notifications" className="admin-notification"><AdminAsset name="greetingBell" /><i /></a><Link href="/admin/settings" aria-label="Your profile" className="admin-greeting-avatar"><span className="admin-avatar gold">JA</span></Link></div>
    </div>
    {notice && <div role="status" className="admin-notice">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")}>×</button></div>}
    <section className="admin-summary" aria-label="Application overview">{summaryCards.map((card) => <Link href={`/admin/applications?status=${card.status}`} key={card.label} className="admin-summary-card"><h2>{card.label}</h2><strong>{card.value}</strong><p><b>↗ 12%</b> from last month</p></Link>)}</section>
    <section className="admin-panel admin-quick-actions"><div className="admin-panel-heading"><h2><AdminAsset name="flash" />Quick actions</h2><details className="admin-dropdown"><summary>More actions<AdminAsset name="smallDown" /></summary><div className="admin-dropdown-panel"><Link href="/admin/customers">View customers</Link><Link href="/admin/companies">View companies</Link><Link href="/admin/compliance">Review compliance</Link></div></details></div><div className="admin-quick-links">{[
      { label: "Review documents", icon: "review", href: "/admin/applications?task=review-documents" },
      { label: "Add new country", icon: "country", href: "/admin/jurisdictions" },
      { label: "Manage services", icon: "services", href: "/admin/services" },
      { label: "Process refund", icon: "refund", href: "/admin/payments" },
    ].map((action) => <Link key={action.label} href={action.href}><span className="admin-quick-icon"><AdminAsset name={action.icon} /></span><strong>{action.label}</strong><span className="admin-quick-arrow"><AdminAsset name="right" /></span></Link>)}</div></section>
    <div className="admin-dashboard-body">
      <section className="admin-panel admin-service-panel"><PanelHeading title="Applications by Service" period /><div className="admin-service-content"><div className="admin-donut" role="img" aria-label="248 applications: company registration 42%, trademark registration 24%, business licensing 18%, business banking 10%, others 6%"><div><strong>248</strong><span>Applications</span></div></div><ul className="admin-service-legend">{serviceBreakdown.map((service) => <li key={service.label}><span className="admin-legend-label"><i style={{ background: service.color }} /><span>{service.label === "Others" ? service.label : <>{service.label.split(" ")[0]}<br />{service.label.split(" ").slice(1).join(" ")}</>}</span></span><strong>{service.percentage}%</strong></li>)}</ul></div></section>
      <div className="admin-chart-row">
        <section className="admin-panel"><PanelHeading title="Applications by Jurisdiction" period /><ul className="admin-jurisdictions">{jurisdictions.map((country) => <li key={country.label}><span>{country.label}</span><div className="admin-bar"><div style={{ width: `${country.width}%`, background: country.color }} /></div><strong>{country.count}</strong></li>)}</ul></section>
        <section className="admin-panel"><PanelHeading title="Financial Overview" period /><div className="admin-financials">{[
          { label: "Total Payments", value: "₦28,400,000", change: "14%", icon: "payments", color: "#ecfdf5" },
          { label: "Pending Payments", value: "₦6,200,000", change: "8%", icon: "clock", color: "#fffbeb" },
          { label: "Revenue", value: "₦22,200,000", change: "18%", icon: "chart", color: "#faf5ff" },
        ].map((row) => <div key={row.label}><span className="admin-financial-icon" style={{ background: row.color }}><AdminAsset name={row.icon} /></span><div><p>{row.label}</p><strong>{row.value}</strong></div><span className={`admin-financial-change ${row.label === "Pending Payments" ? "negative" : ""}`}>↗ {row.change}</span></div>)}</div></section>
      </div>
      <section id="recent-activity" className="admin-panel"><PanelHeading title="Recent Activity" count={14}><Link className="admin-text-link" href="/admin/activity">View all</Link></PanelHeading><ul className="admin-activity-list">{activities.map((activity) => <li key={activity.title}><span className="admin-activity-icon" style={{ background: activity.color }}><AdminAsset name={activity.icon} /></span><div><strong>{activity.title}</strong><p>{activity.description}</p></div><span className="admin-activity-time">{activity.time}</span></li>)}</ul></section>
      <section className="admin-panel admin-pending-panel"><PanelHeading title="Pending Tasks" count={14} /><AdminTaskTable /><Link className="admin-text-link admin-all-tasks" href="/admin/applications?status=action-required">View all pending tasks<AdminAsset name="arrow" /></Link></section>
    </div>
    <dialog ref={assignmentDialog} aria-labelledby="assign-application-title" onCancel={() => setAssignOpen(false)} className="admin-native-dialog" onClick={(event) => { if (event.target === event.currentTarget) setAssignOpen(false); }}><section className="admin-modal"><div className="admin-panel-heading"><h2 id="assign-application-title">Assign application</h2><button aria-label="Close assignment" onClick={() => setAssignOpen(false)}>×</button></div><form onSubmit={(event) => { event.preventDefault(); setNotice(`${selectedApplication} assigned to ${assignee} in this preview.`); setAssignOpen(false); }}><label>Application<select value={selectedApplication} onChange={(event) => setSelectedApplication(event.target.value)}>{pendingTasks.map((task) => <option key={task.reference}>{task.reference}</option>)}</select></label><label>Assign to<select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option>John Adeyemi</option><option>Admin</option></select></label><p>Assignments in this preview are not saved to a server.</p><div className="admin-modal-actions"><button type="button" className="admin-button" onClick={() => setAssignOpen(false)}>Cancel</button><button className="admin-button primary">Assign application</button></div></form></section></dialog>
  </div>;
}
