'use client';
import { useState, type FormEvent } from 'react';
import { displayDate } from '@/data/admin/applications';
import { money } from '@/data/admin/companies';
import { invoiceStatus, invoiceTotals, type AdminInvoice } from '@/data/admin/payments';
import { useCustomers } from './customerStore';
import { getInvoice, saveInvoice } from './paymentStore';
import { Field, SmallIcon } from './ApplicationUI';
import CompanyDialog from './CompanyDialogs';
export default function PaymentActions({ invoice, onClose, onRecord, onChanged }: { invoice: AdminInvoice; onClose: () => void; onRecord: () => void; onChanged: (message: string) => void }) {
  const [mode, setMode] = useState('actions'); const [date, setDate] = useState(invoice.dueDate); const [reason, setReason] = useState(''); const [error, setError] = useState('');
  const customer = useCustomers().find(item => item.id === invoice.customerId); const status = invoiceStatus(invoice); const canRecord = !['Paid', 'Cancelled'].includes(status); const canCancel = !invoice.cancelled && invoice.receipts.length === 0;
  function update(event: FormEvent, cancel: boolean) {
    event.preventDefault(); setError('');
    try {
      const current = getInvoice(invoice.id); if (!current) throw new Error('This invoice is unavailable.');
      if (current.cancelled || invoiceStatus(current) === 'Paid') throw new Error('This invoice cannot be changed.');
      if (cancel && current.receipts.length) throw new Error('Invoices with recorded payments cannot be cancelled.');
      const title = cancel ? 'Invoice cancelled' : 'Due date changed';
      saveInvoice({ ...current, ...(cancel ? { cancelled: true } : { dueDate: date }), events: [{ id: crypto.randomUUID(), title, detail: `${cancel ? 'Cancelled by Admin.' : `Due date changed from ${displayDate(current.dueDate)} to ${displayDate(date)}.`}${reason.trim() ? ` ${reason.trim()}` : ''}`, date: new Date().toISOString() }, ...current.events] });
      onChanged(cancel ? 'Invoice cancelled.' : 'Due date updated.'); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this invoice.'); }
  }
  const reminder = `Hello ${customer?.name ?? ''},\n\nThis is a reminder for invoice ${invoice.number}: ${invoice.service}.\nOutstanding balance: ${money(invoiceTotals(invoice).balance, invoice.currency)}\nDue date: ${displayDate(invoice.dueDate)}\n\nRegistat`;
  return <CompanyDialog title={mode === 'due' ? 'Change due date' : mode === 'cancel' ? 'Cancel invoice?' : mode === 'reminder' ? 'Payment reminder' : 'Payment actions'} onClose={onClose} className="payment-actions-modal">
    {mode === 'actions' ? <><p className="payment-modal-description">Choose an action for {invoice.number}.</p><div className="payment-action-options">{[['check', 'Mark as paid', 'Record a payment and mark this invoice as paid.', 'record', canRecord], ['send', 'Send reminder', 'Prepare a payment reminder for the customer.', 'reminder', canRecord], ['calendar', 'Reschedule due date', 'Set a new due date for this invoice.', 'due', canRecord], ['close', 'Cancel invoice', 'Cancel this invoice. Its record will be retained.', 'cancel', canCancel]].map(([icon, title, description, action, enabled]) => <button key={String(action)} disabled={!enabled} onClick={() => action === 'record' ? onRecord() : setMode(String(action))}><span className={`payment-action-icon ${action}`}><SmallIcon name={String(icon)} /></span><span><strong>{title}</strong><small>{description}</small></span><span>›</span></button>)}</div><footer><button className="application-button" onClick={onClose}>Cancel</button></footer></> : mode === 'reminder' ? <><div className="company-dialog-body"><p>To: {customer?.email}</p><pre className="company-reminder-text">{reminder}</pre><p className="company-empty">Review and send this draft from your email app.</p></div><footer><button className="application-button" onClick={() => setMode('actions')}>Back</button><a className="application-button primary" href={`mailto:${customer?.email ?? ''}?subject=${encodeURIComponent(`Payment reminder: ${invoice.number}`)}&body=${encodeURIComponent(reminder)}`}>Open email draft</a></footer></> : <form onSubmit={event => update(event, mode === 'cancel')}><div className="company-dialog-body application-form-fields">{mode === 'due' ? <Field label="New due date" required><input required type="date" min={invoice.issueDate} value={date} onInput={event => setDate(event.currentTarget.value)} onChange={event => setDate(event.target.value)} /></Field> : <p>Cancel {invoice.number}? It will no longer be payable. Recorded invoice details will remain available.</p>}<Field label={mode === 'cancel' ? 'Reason (optional)' : 'Reason for change (optional)'}><textarea rows={3} maxLength={1000} placeholder="Add any notes…" value={reason} onChange={event => setReason(event.target.value)} /></Field>{error && <p className="customer-error" role="alert">{error}</p>}</div><footer><button type="button" className="application-button" onClick={() => setMode('actions')}>Go back</button><button type="submit" className={`application-button ${mode === 'cancel' ? 'payment-danger-button' : 'primary'}`}>{mode === 'cancel' ? 'Confirm cancellation' : 'Confirm change'}</button></footer></form>}
  </CompanyDialog>;
}
