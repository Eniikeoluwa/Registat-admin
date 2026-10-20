"use client";

import { useEffect, useRef, useState } from "react";
import { applicationStatuses, displayDate, initials, jurisdictionFlags, type AdminApplication } from "@/data/admin/applications";
import { copyText, Field, SmallIcon, StatusBadge } from "./ApplicationUI";
import { downloadDocument, saveApplication } from "./applicationStore";

export default function ApplicationDrawer({ application, onClose }: { application: AdminApplication; onClose: () => void }) {
  const [tab, setTab] = useState("Overview");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<"customer" | "details" | "status" | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);

  function update(changes: Partial<AdminApplication>) {
    try { saveApplication({ ...application, ...changes, updated: new Date().toISOString() }); setMessage("Changes saved in this browser."); setEditing(null); }
    catch { setMessage("Could not save changes. Check browser storage and try again."); }
  }

  function addNote() {
    if (!note.trim()) return;
    try {
      saveApplication({ ...application, updated: new Date().toISOString(), notes: [...application.notes, { id: crypto.randomUUID(), text: note.trim(), date: new Date().toISOString() }] });
      setNote(""); setMessage("Note saved.");
    } catch { setMessage("Could not save this note. Please try again."); }
  }

  const received = application.documents.filter((doc) => doc.state !== "Pending").length;
  const progress = application.status === "Completed" ? 4 : application.status === "Under Review" ? 2 : application.status === "Awaiting Payment" ? 0 : 1;

  return <aside className="application-drawer" aria-label={`Application details for ${application.reference}`} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
    <header className="application-drawer-header"><div className="application-drawer-title"><h2 ref={title} tabIndex={-1}>{application.reference}</h2><button aria-label="Copy application reference" onClick={() => void copyText(application.reference).then(() => setMessage("Reference copied.")).catch((error: Error) => setMessage(error.message))}><SmallIcon name="copy" /></button><StatusBadge status={application.status} /><button className="application-drawer-close" aria-label="Close application details" onClick={onClose}><SmallIcon name="close" /></button></div><p>{application.service} • {application.entityType}</p></header>
    <div role="tablist" aria-label="Application detail sections" className="application-drawer-tabs">{["Overview", "Documents", "Timeline", "Notes"].map((name) => <button key={name} id={`application-tab-${name}`} role="tab" aria-selected={tab === name} aria-controls="application-tab-content" onClick={() => { setTab(name); setEditing(null); }}>{name}</button>)}</div>
    <div className="application-drawer-body" role="tabpanel" id="application-tab-content" aria-labelledby={`application-tab-${tab}`}>
      {message && <p className="application-inline-message" role="status">{message}</p>}
      {editing && <form className="application-editor" onSubmit={(event) => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        if (editing === "customer") update({ customer: { name: String(data.get("name")).trim(), email: String(data.get("email")).trim(), phone: String(data.get("phone")).trim() } });
        else if (editing === "status") update({ status: String(data.get("status")) as AdminApplication["status"] });
        else update({ companyName: String(data.get("companyName")).trim(), address: String(data.get("address")).trim(), assignedTo: String(data.get("assignedTo")).trim() });
      }}><h3>Edit {editing === "details" ? "application details" : editing}</h3>
        {editing === "customer" ? <><Field label="Customer name" required><input name="name" defaultValue={application.customer.name} required /></Field><Field label="Email" required><input type="email" name="email" defaultValue={application.customer.email} required /></Field><Field label="Phone number"><input name="phone" type="tel" defaultValue={application.customer.phone} /></Field></> : editing === "status" ? <Field label="Status"><select name="status" defaultValue={application.status}>{applicationStatuses.map((status) => <option key={status}>{status}</option>)}</select></Field> : <><Field label="Company name" required><input name="companyName" defaultValue={application.companyName} required /></Field><Field label="Registered address" required><textarea name="address" defaultValue={application.address} required /></Field><Field label="Assigned to"><select name="assignedTo" defaultValue={application.assignedTo}><option>Admin</option><option>John Adeyemi</option><option>Unassigned</option></select></Field></>}
        <div className="application-editor-actions"><button type="button" className="application-button" onClick={() => setEditing(null)}>Cancel</button><button className="application-button primary">Save changes</button></div>
      </form>}
      {tab === "Overview" && !editing && <>
        <section className="application-detail-section"><div className="application-section-heading"><h3>Customer information</h3><button className="application-small-button" onClick={() => setEditing("customer")}>Edit</button></div><div className="application-customer-info"><span className="application-initials">{initials(application.customer.name)}</span><div><strong>{application.customer.name}</strong><p>{application.customer.email}</p><p>{application.customer.phone}</p></div></div></section>
        <section className="application-detail-section"><div className="application-section-heading"><h3>Application details</h3><button className="application-small-button" onClick={() => setEditing("details")}>Edit</button></div><dl className="application-detail-list">{[
          ["document", "Service", application.service], ["building", "Entity type", application.entityType], ["globe", "Jurisdiction", `${jurisdictionFlags[application.jurisdiction] ?? ""} ${application.jurisdiction}`],
          ["calendar", "Submitted on", `${displayDate(application.submitted)}, ${displayDate(application.submitted, true)}`], ["clock", "Last updated", `${displayDate(application.updated)}, ${displayDate(application.updated, true)}`], ["user", "Assigned to", application.assignedTo === "Admin" ? "Admin (you)" : application.assignedTo],
        ].map(([icon, label, value]) => <div key={label}><dt><SmallIcon name={icon} />{label}</dt><dd>{value}</dd></div>)}</dl></section>
        <section className="application-detail-section"><h3>Progress</h3><ol className="application-progress">{["Payment", "Document Submission", "Review", "Completion"].map((label, index) => <li key={label} className={index < progress ? "done" : index === progress ? "current" : ""}><span>{index < progress && <SmallIcon name="check" />}</span><p>{label}</p></li>)}</ol><p className="application-info"><SmallIcon name="info" />{received} of {application.documents.length} documents received.</p></section>
        <section className="application-detail-section"><h3>Quick actions</h3><div className="application-drawer-actions"><button className="application-button dark" onClick={() => setTab("Documents")}><SmallIcon name="document" />View documents</button><button className="application-button" onClick={() => setTab("Notes")}><SmallIcon name="note" />Add note</button><button className="application-button" onClick={() => setEditing("status")}><SmallIcon name="refresh" />Change status</button><a className="application-button" href={`mailto:${application.customer.email}`}><SmallIcon name="send" />Contact customer</a></div></section>
      </>}
      {tab === "Documents" && !editing && <section className="application-detail-section"><h3>Application documents</h3><div className="application-drawer-documents">{application.documents.map((doc) => <div key={doc.id}><SmallIcon name="document" /><div><strong>{doc.name}</strong><p>{doc.filename ?? doc.state}</p></div>{doc.fileKey ? <button className="application-small-button" onClick={() => void downloadDocument(doc.fileKey!, doc.filename ?? doc.name).catch((error: Error) => setMessage(error.message))}>Download</button> : <span className="application-document-state">{doc.state}</span>}</div>)}</div></section>}
      {tab === "Timeline" && !editing && <section className="application-detail-section"><h3>Application timeline</h3><ol className="application-timeline"><li><strong>Application created</strong><p>{displayDate(application.submitted)} · {displayDate(application.submitted, true)}</p></li><li><strong>{application.status}</strong><p>Last updated {displayDate(application.updated)} · {displayDate(application.updated, true)}</p></li>{application.notes.map((item) => <li key={item.id}><strong>Internal note added</strong><p>{item.text}</p><small>{displayDate(item.date)}</small></li>)}</ol></section>}
      {(tab === "Notes" || tab === "Overview") && !editing && <section className="application-detail-section application-notes"><h3>Internal notes</h3>{application.notes.map((item) => <article key={item.id}><p>{item.text}</p><small>Admin · {displayDate(item.date)}</small></article>)}{tab === "Notes" && !application.notes.length && <p className="application-muted">No notes yet.</p>}<form onSubmit={(event) => { event.preventDefault(); addNote(); }}><label className="sr-only" htmlFor="application-note">Add internal note</label><textarea id="application-note" placeholder="Add a note…" value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} /><button className="application-small-button" disabled={!note.trim()}>Add note</button></form></section>}
    </div>
  </aside>;
}
