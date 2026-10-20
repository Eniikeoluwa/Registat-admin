'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { displayDate, initials, type AdminApplication } from '@/data/admin/applications';
import type { AdminCustomer, CustomerStatus } from '@/data/admin/customers';
import { SmallIcon, StatusBadge } from './ApplicationUI';
import { saveCustomer } from './customerStore';
import { useCompanies } from './companyStore';
export function CustomerAvatar({ customer }: { customer: AdminCustomer }) {
  return <span className="customer-avatar" style={customer.photo ? { backgroundImage: `url(${customer.photo})` } : undefined}>{!customer.photo && initials(customer.name)}</span>;
}
export function CustomerBadge({ status }: { status: CustomerStatus }) { return <span className={`customer-badge ${status.toLowerCase()}`}>{status}</span>; }
export function customerCompanies(applications: AdminApplication[]) {
  return [...new Map(applications.filter(app => app.service === 'Company Registration' && app.companyName).map(app => [app.companyName.toLowerCase(), app])).values()];
}
export default function CustomerDrawer({ customer, applications, onClose, onEdit }: { customer: AdminCustomer; applications: AdminApplication[]; onClose: () => void; onEdit: () => void }) {
  const [tab, setTab] = useState('Overview');
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const noteInput = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  useEffect(() => { if (noteOpen) noteInput.current?.focus(); }, [noteOpen]);
  const companyRecords = useCompanies().filter(company => company.owner.id === customer.id || company.owner.email.toLowerCase() === customer.email.toLowerCase());
  const companies = [...companyRecords, ...customerCompanies(applications).filter(app => !companyRecords.some(company => company.id === app.companyId || company.name.toLowerCase() === app.companyName.toLowerCase()))];
  const recentApps = [...applications].sort((a, b) => b.submitted.localeCompare(a.submitted));
  function status(value: CustomerStatus) {
    try { saveCustomer({ ...customer, status: value, events: [{ id: crypto.randomUUID(), text: `Status changed to ${value}`, date: new Date().toISOString() }, ...customer.events] }); setError(''); }
    catch { setError('Could not save this change. Please check browser storage and try again.'); }
  }
  function addNote(event: FormEvent) {
    event.preventDefault(); if (!note.trim()) return;
    try { saveCustomer({ ...customer, notes: [{ id: crypto.randomUUID(), text: note.trim(), date: new Date().toISOString() }, ...customer.notes] }); setNote(''); setNoteOpen(false); setTab('Activity'); setError(''); }
    catch { setError('Could not save this note. Please try again.'); }
  }
  function applicationList(limit?: number) {
    return recentApps.length ? <div className="customer-related-list">{recentApps.slice(0, limit).map(app => <Link key={app.reference} href={`/admin/applications/${encodeURIComponent(app.reference)}`}><span className="customer-related-icon"><SmallIcon name="document" /></span><span><strong>{app.reference}</strong><small>{app.service}</small></span><span className="customer-related-end"><StatusBadge status={app.status} /><small>{displayDate(app.submitted)}</small></span></Link>)}</div> : <p className="customer-empty-text">No applications yet. Applications created for this email will appear here.</p>;
  }
  function companyList(limit?: number) {
    return companies.length ? <div className="customer-related-list">{companies.slice(0, limit).map(item => 'name' in item ? <Link key={item.id} href={`/admin/companies/${item.id}`}><span className="customer-avatar">{initials(item.name)}</span><span><strong>{item.name}</strong><small>{item.entityType} · {item.jurisdiction}</small></span><span className="customer-related-end"><span className={`customer-badge ${item.status === 'Active' ? 'active' : 'inactive'}`}>{item.status}</span></span></Link> : <Link key={item.reference} href={`/admin/applications/${encodeURIComponent(item.reference)}`}><span className="customer-avatar">{initials(item.companyName)}</span><span><strong>{item.companyName}</strong><small>{item.entityType} · {item.jurisdiction}</small></span><span className="customer-related-end"><StatusBadge status={item.status} /></span></Link>)}</div> : <p className="customer-empty-text">No company registrations linked to this customer.</p>;
  }
  return <aside className="application-drawer customer-drawer" aria-label={`Customer profile: ${customer.name}`} onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
    <header className="customer-profile-header"><CustomerAvatar customer={customer} /><div><div className="customer-profile-title"><h2 ref={heading} tabIndex={-1}>{customer.name}</h2><CustomerBadge status={customer.status} /></div><p>{customer.type} customer</p><small>Customer since {displayDate(customer.joined)}</small></div><button className="application-icon-button" aria-label="Close customer profile" onClick={onClose}><SmallIcon name="close" /></button></header>
    <div className="application-drawer-tabs" aria-label="Customer profile sections">{['Overview', 'Companies', 'Applications', 'Activity'].map(value => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}{value === 'Companies' ? ` (${companies.length})` : value === 'Applications' ? ` (${applications.length})` : ''}</button>)}</div>
    <div className="application-drawer-body">{error && <p className="customer-error" role="alert">{error}</p>}
    {tab === 'Overview' && <><section className="application-detail-section"><div className="application-section-heading"><h3>Contact information</h3><button className="application-small-button" onClick={onEdit}>Edit</button></div><dl className="application-detail-list customer-contact-list">{[['user', customer.type === 'Business' ? 'Business name' : 'Full name', customer.name], ['email', 'Email address', customer.email], ['phone', 'Phone number', customer.phone], ['document', 'Identity type', customer.identityType || 'Not provided'], ['key', 'Identity number', customer.identityNumber || 'Not provided'], ['location', 'Address', customer.address || 'Not provided']].map(([icon, label, value]) => <div key={label}><dt><SmallIcon name={icon} />{label}</dt><dd>{value}</dd></div>)}</dl><div className="customer-stat-cards"><button onClick={() => setTab('Companies')}><strong>{companies.length}</strong><span>Companies</span><SmallIcon name="building" /></button><button onClick={() => setTab('Applications')}><strong>{applications.length}</strong><span>Applications</span><SmallIcon name="document" /></button></div></section>
    <section className="application-detail-section"><div className="application-section-heading"><h3>Recent applications</h3><button className="customer-text-button" onClick={() => setTab('Applications')}>View all</button></div>{applicationList(3)}</section>
    <section className="application-detail-section"><div className="application-section-heading"><h3>Recent companies</h3><button className="customer-text-button" onClick={() => setTab('Companies')}>View all</button></div>{companyList(2)}</section></>}
    {tab === 'Companies' && <section className="application-detail-section"><h3>Companies ({companies.length})</h3>{companyList()}</section>}
    {tab === 'Applications' && <section className="application-detail-section"><h3>Applications ({applications.length})</h3>{applicationList()}<Link className="application-button primary customer-create-application" href={`/admin/applications/new?customer=${encodeURIComponent(customer.email)}`}><SmallIcon name="plus" />New application</Link></section>}
    {tab === 'Activity' && <section className="application-detail-section"><h3>Customer activity</h3><div className="customer-activity">{[...customer.notes.map(item => ({ ...item, label: 'Internal note' })), ...customer.events.map(item => ({ ...item, label: 'Admin' })), { id: 'joined', text: 'Customer joined Registat', date: customer.joined, label: 'Customer' }].sort((a, b) => b.date.localeCompare(a.date)).map(item => <article key={item.id}><span className="customer-related-icon"><SmallIcon name={item.label === 'Internal note' ? 'note' : 'clock'} /></span><div><strong>{item.label}</strong><p>{item.text}</p><small>{displayDate(item.date)} · {displayDate(item.date, true)}</small></div></article>)}</div></section>}
    <section className="application-detail-section"><h3>Quick actions</h3><div className="customer-quick-actions"><button className="application-button dark" onClick={() => setTab('Applications')}><SmallIcon name="document" />View all applications</button><button className="application-button" onClick={() => setNoteOpen(true)}><SmallIcon name="note" />Add note</button><a className="application-button" href={`mailto:${customer.email}`}><SmallIcon name="email" />Send email</a><details className="applications-more"><summary>••• More actions</summary><div><button onClick={onEdit}>Edit customer</button>{(['Active', 'Inactive', 'Blocked'] as const).filter(value => value !== customer.status).map(value => <button key={value} onClick={event => { status(value); event.currentTarget.closest('details')?.removeAttribute('open'); }}>Set as {value.toLowerCase()}</button>)}</div></details></div>
    {noteOpen && <form className="customer-note-form" onSubmit={addNote}><label className="application-field"><span>Internal note</span><textarea ref={noteInput} required maxLength={1000} rows={3} value={note} onChange={event => setNote(event.target.value)} placeholder="Add a note…" /></label><div><button className="application-small-button" type="button" onClick={() => setNoteOpen(false)}>Cancel</button><button className="application-button primary" type="submit">Save note</button></div></form>}</section>
    </div>
  </aside>;
}
