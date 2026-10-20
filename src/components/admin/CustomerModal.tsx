'use client';

import { lockAdminDialogScroll } from "./dialogScrollLock";
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { applicationJurisdictions } from '@/data/admin/applications';
import { customerRecord, type AdminCustomer } from '@/data/admin/customers';
import { Field, SmallIcon } from './ApplicationUI';
import { saveCustomer, useCustomers } from './customerStore';
import { saveApplication, useApplications } from './applicationStore';
import { useCompanies, saveCompany, companyEvent } from './companyStore';

export default function CustomerModal({ customer, onClose, onSaved }: { customer?: AdminCustomer; onClose: () => void; onSaved: (id: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const customers = useCustomers();
  const applications = useApplications();
  const companies = useCompanies();
  const [type, setType] = useState<'Individual' | 'Business'>(customer?.type ?? 'Individual');
  const [name, setName] = useState(customer?.name ?? '');
  const [email, setEmail] = useState(customer?.email ?? '');
  const initialPrefix = ['+234', '+254', '+44', '+971', '+1'].find(code => customer?.phone.startsWith(code)) ?? '+234';
  const [phone, setPhone] = useState(customer?.phone.replace(new RegExp(`^\\${initialPrefix}`), '').trim() ?? '');
  const [prefix, setPrefix] = useState(initialPrefix);
  const [address, setAddress] = useState(customer?.address ?? '');
  const [jurisdiction, setJurisdiction] = useState(customer?.jurisdiction ?? 'Nigeria');
  const [photo, setPhoto] = useState(customer?.photo);
  const [identityType, setIdentityType] = useState(customer?.identityType ?? '');
  const [identityNumber, setIdentityNumber] = useState(customer?.identityNumber ?? '');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const el = dialog.current; const releaseScroll = lockAdminDialogScroll();
    el?.showModal();
    return () => { el?.close(); releaseScroll(); };
  }, []);
  async function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Choose a JPG or PNG image up to 2 MB.'); return; }
    setPhotoLoading(true); setError('');
    try {
      const result = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file); });
      setPhoto(result);
    } catch { setError('Could not read this photo. Please try another image.'); }
    finally { setPhotoLoading(false); }
  }
  function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!name.trim() || !address.trim()) { setError('Enter a name and address.'); return; }
    if (!/^\+?[\d\s()-]{7,24}$/.test(phone.trim())) { setError('Enter a valid phone number.'); return; }
    if (customers.some(record => record.id !== customer?.id && record.email.toLowerCase() === email.trim().toLowerCase())) { setError('A customer with this email address already exists.'); return; }
    try {
      const now = new Date().toISOString();
      const record: AdminCustomer = { ...(customer ?? customerRecord({ name: '', email: '', phone: '' }, crypto.randomUUID(), now)), name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim().startsWith('+') ? phone.trim() : `${prefix} ${phone.trim()}`, address: address.trim(), jurisdiction, type, photo, identityType, identityNumber };
      record.events = [{ id: crypto.randomUUID(), text: customer ? 'Customer details updated' : 'Customer added by Admin', date: now }, ...record.events];
      saveCustomer(record);
      if (customer) applications.filter(app => app.customer.email.toLowerCase() === customer.email.toLowerCase()).forEach(app => saveApplication({ ...app, customer: { name: record.name, email: record.email, phone: record.phone } }));
      if (customer) companies.filter(company => company.owner.id === customer.id || company.owner.email.toLowerCase() === customer.email.toLowerCase()).forEach(company => saveCompany({ ...company, owner: { id: record.id, name: record.name, email: record.email, phone: record.phone }, events: [companyEvent("Owner contact updated", "Customer contact details updated by Admin."), ...company.events] }));
      onSaved(record.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this customer. Browser storage may be full.'); }
  }
  return <dialog ref={dialog} className="customer-modal" aria-labelledby="customer-modal-heading" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><form onSubmit={submit}>
    <header><div><h2 id="customer-modal-heading">{customer ? 'Edit customer' : 'Add customer'}</h2><p>{customer ? 'Update customer details.' : 'Add a customer to Registat.'}</p></div><button type="button" className="application-icon-button" aria-label="Close customer modal" onClick={onClose}><SmallIcon name="close" /></button></header>
    <div className="customer-modal-body"><fieldset><legend>Customer type</legend><div className="customer-type-options">{(['Individual', 'Business'] as const).map(value => <button type="button" aria-pressed={type === value} key={value} onClick={() => setType(value)}><SmallIcon name={value === 'Individual' ? 'user' : 'building'} />{value}</button>)}</div></fieldset>
    <div><p className="customer-field-label">Profile photo <span>(optional)</span></p><label className="customer-photo-upload"><input type="file" accept="image/jpeg,image/png" aria-label="Upload profile photo" onChange={event => { void upload(event.target.files?.[0]); event.target.value = ''; }} />{photo ? <span className="customer-avatar" style={{ backgroundImage: `url(${photo})` }} /> : <SmallIcon name="photo" />}<span><strong>{photoLoading ? 'Reading photo…' : photo ? 'Change photo' : 'Upload photo'}</strong><small>JPG, PNG (max 2MB)</small></span></label>{photo && <button className="customer-text-button" type="button" onClick={() => setPhoto(undefined)}>Remove photo</button>}</div>
    <Field label={type === 'Business' ? 'Business name' : 'Full name'} required><input autoFocus required maxLength={120} placeholder="e.g. Tunde Adebayo" value={name} onChange={event => setName(event.target.value)} /></Field>
    <Field label="Email address" required><input required type="email" maxLength={180} placeholder="e.g. tunde@example.com" value={email} onChange={event => setEmail(event.target.value)} /></Field>
    <div><p className="customer-field-label">Phone number <b>*</b></p><div className="customer-phone"><select aria-label="Phone country code" value={prefix} onChange={event => setPrefix(event.target.value)}><option value="+234">🇳🇬 +234</option><option value="+254">🇰🇪 +254</option><option value="+44">🇬🇧 +44</option><option value="+1">🇺🇸 +1</option><option value="+971">🇦🇪 +971</option></select><input required aria-label="Phone number" type="tel" maxLength={24} placeholder="e.g. 801 234 5678" value={phone} onChange={event => setPhone(event.target.value)} /></div></div>
    <Field label="Jurisdiction" required><select value={jurisdiction} onChange={event => setJurisdiction(event.target.value)}>{applicationJurisdictions.map(country => <option key={country}>{country}</option>)}</select></Field>
    <Field label="Address" required><textarea required maxLength={500} rows={2} placeholder="e.g. 123 Adeola Street, Victoria Island, Lagos" value={address} onChange={event => setAddress(event.target.value)} /></Field>
    {customer && <><Field label="Identity type (optional)"><select value={identityType} onChange={event => setIdentityType(event.target.value)}><option value="">Not provided</option><option>NIN</option><option>Passport</option><option>Driver’s license</option><option>Business registration</option></select></Field><Field label="Identity number (optional)"><input maxLength={60} value={identityNumber} onChange={event => setIdentityNumber(event.target.value)} /></Field></>}
    {error && <p className="customer-error" role="alert">{error}</p>}</div>
    <footer><button type="button" className="application-button soft" onClick={onClose}>Cancel</button><button type="submit" className="application-button primary" disabled={photoLoading}>{customer ? 'Save changes' : 'Add customer'}</button></footer>
  </form></dialog>;
}
