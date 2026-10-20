'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { applicationJurisdictions, displayDate } from '@/data/admin/applications';
import { SmallIcon } from './ApplicationUI';
import { useApplications } from './applicationStore';
import { useCustomers } from './customerStore';
import { useCompanies } from './companyStore';
import CustomerDrawer, { CustomerAvatar, CustomerBadge, customerCompanies } from './CustomerDrawer';
import CustomerModal from './CustomerModal';
const PAGE_SIZE = 10;
export default function CustomersWorkspace() {
  const router = useRouter();
  const segment = usePathname().split('/')[3];
  const customers = useCustomers();
  const applications = useApplications();
  const companies = useCompanies();
  const customer = segment && segment !== 'new' ? customers.find(item => item.id === decodeURIComponent(segment)) : undefined;
  const [tab, setTab] = useState('All customers');
  const [query, setQuery] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');
  const tabs = ['All customers', 'Individual', 'Business', 'Active', 'Inactive'];
  const tabMatches = (item: typeof customers[number], value: string) => value === 'All customers' || item.type === value || item.status === value;
  const filtered = customers.filter(item => tabMatches(item, tab) && (!type || type === item.type) && (!status || status === item.status) && (!jurisdiction || jurisdiction === item.jurisdiction) && (!from || item.joined.slice(0, 10) >= from) && (!to || item.joined.slice(0, 10) <= to) && `${item.name} ${item.email} ${item.phone}`.toLowerCase().includes(query.trim().toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allSelected = rows.length > 0 && rows.every(item => selected.has(item.id));
  const linked = (email: string) => applications.filter(app => app.customer.email.toLowerCase() === email.toLowerCase());
  const open = (id: string) => router.push(`/admin/customers/${encodeURIComponent(id)}`, { scroll: false });
  const close = () => router.push('/admin/customers', { scroll: false });
  function toggle(id: string) { setSelected(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; }); }
  function reset() { setQuery(''); setType(''); setStatus(''); setJurisdiction(''); setFrom(''); setTo(''); setTab('All customers'); setPage(1); setSelected(new Set()); }
  function exportCustomers() {
    const records = selected.size ? filtered.filter(item => selected.has(item.id)) : filtered;
    if (!records.length) { setNotice('No matching customers to export.'); return; }
    const cell = (value: string) => `"${(/^[=+@\-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
    const csv = [['Name', 'Type', 'Email', 'Phone', 'Status', 'Jurisdiction', 'Date joined'], ...records.map(item => [item.name, item.type, item.email, item.phone, item.status, item.jurisdiction, displayDate(item.joined)])].map(row => row.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'registat-customers.csv'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${records.length} customers.`);
  }
  return <div className={`applications-workspace customers-workspace ${segment && segment !== 'new' ? 'has-drawer' : ''}`}><section className="applications-main" aria-label="Customers workspace">
    <header className="applications-page-header"><div><h1>Customers</h1><p>View and manage all customers on Registat.</p></div><Link className="application-button primary" href="/admin/customers/new" scroll={false}><SmallIcon name="plus" />Add customer</Link></header>
    <div className="applications-status-tabs" aria-label="Filter customer category">{tabs.map(value => <button key={value} aria-pressed={tab === value} onClick={() => { setTab(value); setType(''); setStatus(''); setPage(1); }}>{value} ({customers.filter(item => tabMatches(item, value)).length})</button>)}</div>
    <div className="applications-filters"><div className="application-search-input"><SmallIcon name="search" /><input aria-label="Search customers" placeholder="Search customers (name, email, phone...)" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} /></div><div className="applications-filter-controls"><select aria-label="Customer type filter" value={type} onChange={event => { setType(event.target.value); setPage(1); }}><option value="">Customer type</option><option>Individual</option><option>Business</option></select><select aria-label="Customer status filter" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">Status</option><option>Active</option><option>Inactive</option><option>Blocked</option></select><select aria-label="Customer jurisdiction filter" value={jurisdiction} onChange={event => { setJurisdiction(event.target.value); setPage(1); }}><option value="">Jurisdiction</option>{applicationJurisdictions.map(country => <option key={country}>{country}</option>)}</select><details className="applications-date-filter"><summary><SmallIcon name="calendar" />{from || to ? 'Date range selected' : 'Select date range'}</summary><div><label>Joined from<input type="date" aria-label="Joined from" max={to || undefined} value={from} onChange={event => { setFrom(event.target.value); setPage(1); }} /></label><label>Joined to<input type="date" aria-label="Joined to" min={from || undefined} value={to} onChange={event => { setTo(event.target.value); setPage(1); }} /></label><button onClick={() => { setFrom(''); setTo(''); }}>Clear dates</button></div></details><details className="applications-more"><summary aria-label="More customer actions">···</summary><div><button onClick={exportCustomers}>Export {selected.size ? 'selected customers' : 'customers'}</button><button onClick={reset}>Clear filters and selection</button></div></details></div></div>
    {notice && <p className="application-inline-message" role="status">{notice}<button aria-label="Dismiss customer notification" onClick={() => setNotice('')}>×</button></p>}
    <div className="applications-table-card"><div className="applications-table-scroll"><table className="applications-table customers-table"><colgroup>{[42, 200, 105, 190, 155, 85, 100, 90, 110, 36].map((width, index) => <col key={index} style={{ width }} />)}</colgroup><thead><tr><th><input type="checkbox" aria-label="Select all customers on this page" checked={allSelected} ref={el => { if (el) el.indeterminate = !allSelected && rows.some(item => selected.has(item.id)); }} onChange={event => { const checked = event.target.checked; setSelected(current => { const next = new Set(current); rows.forEach(item => checked ? next.add(item.id) : next.delete(item.id)); return next; }); }} /></th>{['Name', 'Type', 'Email', 'Phone number', 'Companies', 'Applications', 'Status', 'Date joined'].map(label => <th key={label} scope="col">{label}</th>)}<th><span className="customer-visually-hidden">Actions</span></th></tr></thead><tbody>{rows.map(item => { const apps = linked(item.email); return <tr key={item.id} className={customer?.id === item.id ? 'is-selected' : ''} onClick={() => open(item.id)}><td onClick={event => event.stopPropagation()}><input type="checkbox" checked={selected.has(item.id)} aria-label={`Select ${item.name}`} onChange={() => toggle(item.id)} /></td><td><button className="customer-name" onClick={event => { event.stopPropagation(); open(item.id); }} aria-label={`Open customer ${item.name}`}><CustomerAvatar customer={item} /><span>{item.name}</span></button></td><td><span className={`customer-type-badge ${item.type.toLowerCase()}`}>{item.type}</span></td><td>{item.email}</td><td>{item.phone}</td><td>{new Set([...customerCompanies(apps).map(app => app.companyName.toLowerCase()), ...companies.filter(company => company.owner.id === item.id || company.owner.email.toLowerCase() === item.email.toLowerCase()).map(company => company.name.toLowerCase())]).size}</td><td>{apps.length}</td><td><CustomerBadge status={item.status} /></td><td>{displayDate(item.joined)}</td><td onClick={event => event.stopPropagation()}><button className="customer-row-more" aria-label={`Actions for ${item.name}`} onClick={() => open(item.id)}>···</button></td></tr>; })}</tbody></table>{!rows.length && <div className="applications-empty"><SmallIcon name="users" /><h2>No customers found</h2><p>Try a different search or adjust your filters.</p><button className="customer-text-button" onClick={reset}>Clear filters</button></div>}</div><footer className="applications-pagination"><p>{selected.size ? `${selected.size} selected · ` : ''}Showing {filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} customers</p><div><button aria-label="Previous customers page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>‹</button><span aria-current="page">{currentPage}</span><button aria-label="Next customers page" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}>›</button></div></footer></div>
  </section>
  {customer && <CustomerDrawer key={customer.id} customer={customer} applications={linked(customer.email)} onClose={close} onEdit={() => setEditing(true)} />}
  {segment && segment !== 'new' && !customer && <aside className="application-drawer application-missing"><h2>Customer unavailable</h2><p>This customer could not be found in this browser.</p><button className="application-button" onClick={close}>Back to customers</button></aside>}
  {(segment === 'new' || (editing && customer)) && <CustomerModal customer={editing ? customer : undefined} onClose={() => { setEditing(false); if (segment === 'new') close(); }} onSaved={id => { setEditing(false); setNotice(editing ? 'Customer updated.' : 'Customer added successfully.'); open(id); }} />}
  </div>;
}
