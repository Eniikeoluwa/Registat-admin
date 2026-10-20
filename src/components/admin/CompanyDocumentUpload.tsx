'use client';
import { useState, type FormEvent } from 'react';
import { documentTypes, type AdminCompany, type CompanyDocument } from '@/data/admin/companies';
import { saveDocumentFiles } from './applicationStore';
import { companyEvent, saveCompany } from './companyStore';
import { Field, SmallIcon } from './ApplicationUI';
import CompanyDialog from './CompanyDialogs';
export default function CompanyDocumentUpload({ company, onClose }: { company: AdminCompany; onClose: () => void }) {
  const [file, setFile] = useState<File>(); const [type, setType] = useState(documentTypes[0]); const [error, setError] = useState(''); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!file || saving) return; setSaving(true); setError('');
    try {
      const id = crypto.randomUUID(); const key = `company:${company.id}:${id}`;
      await saveDocumentFiles([{ key, file }]);
      const document: CompanyDocument = { id, name: file.name, type, size: file.size, uploadedBy: 'Admin', date: new Date().toISOString(), status: 'Pending', fileKey: key };
      saveCompany({ ...company, documents: [document, ...company.documents], events: [companyEvent('Document uploaded', `${file.name} was uploaded by Admin.`), ...company.events] }); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save this document.'); }
    finally { setSaving(false); }
  }
  return <CompanyDialog title="Upload document" onClose={() => { if (!saving) onClose(); }}><form onSubmit={event => void submit(event)}><div className="company-dialog-body application-form-fields"><Field label="Document type"><select value={type} onChange={event => setType(event.target.value)}>{documentTypes.map(value => <option key={value}>{value}</option>)}</select></Field><label className="company-file-drop"><SmallIcon name="upload" /><strong>{file?.name ?? 'Choose a document'}</strong><span>PDF, JPG, PNG · Up to 5MB</span><input required type="file" aria-label="Company document file" accept=".pdf,.jpg,.jpeg,.png" onChange={event => { const selected = event.target.files?.[0]; if (selected && /\.(pdf|jpg|jpeg|png)$/i.test(selected.name) && selected.size <= 5 * 1024 * 1024) { setFile(selected); setError(''); } else { setFile(undefined); setError('Choose a PDF, JPG, or PNG file up to 5 MB.'); event.target.value = ''; } }} /></label>{error && <p className="customer-error" role="alert">{error}</p>}</div><footer><button type="button" className="application-button" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" className="application-button primary" disabled={!file || saving}>{saving ? 'Uploading…' : 'Upload document'}</button></footer></form></CompanyDialog>;
}
