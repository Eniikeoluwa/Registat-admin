import { initialCompanies } from './companies';
export type InvoiceLine = { id: string; description: string; detail: string; quantity: number; unitPrice: number };
export type PaymentReceipt = { id: string; amount: number; method: string; date: string; reference: string; notes: string; paidBy: string; created: string };
export type InvoiceEvent = { id: string; title: string; detail: string; date: string };
export type AdminInvoice = {
  id: string; number: string; customerId: string; companyId?: string; applicationReference?: string;
  jurisdiction: string; service: string; currency: string; issueDate: string; dueDate: string;
  lines: InvoiceLine[]; discount: number; taxRate: number; notes: string; created: string; createdBy: string;
  cancelled: boolean; receipts: PaymentReceipt[]; events: InvoiceEvent[];
};
export const paymentMethods = ['Bank Transfer', 'Card', 'Cash', 'Cheque', 'Other'];
export const invoiceStatuses = ['Paid', 'Pending', 'Partially paid', 'Overdue', 'Cancelled'] as const;
export type InvoiceStatus = typeof invoiceStatuses[number];
const cents = (amount: number) => Math.round((amount + Number.EPSILON) * 100);
export function invoiceTotals(invoice: Pick<AdminInvoice, 'lines' | 'discount' | 'taxRate' | 'receipts'>) {
  const subtotalCents = invoice.lines.reduce((sum, line) => sum + cents(line.quantity * line.unitPrice), 0);
  const discountCents = cents(invoice.discount);
  const taxableCents = subtotalCents - discountCents;
  const taxCents = Math.round(taxableCents * invoice.taxRate / 100);
  const totalCents = taxableCents + taxCents;
  const paidCents = invoice.receipts.reduce((sum, receipt) => sum + cents(receipt.amount), 0);
  return { subtotal: subtotalCents / 100, discount: discountCents / 100, tax: taxCents / 100, total: totalCents / 100, paid: paidCents / 100, balance: Math.max(0, totalCents - paidCents) / 100 };
}
export function invoiceStatus(invoice: AdminInvoice, today = new Date().toISOString().slice(0, 10)): InvoiceStatus {
  if (invoice.cancelled) return 'Cancelled';
  const totals = invoiceTotals(invoice);
  if (totals.paid >= totals.total && totals.total > 0) return 'Paid';
  if (invoice.dueDate < today) return 'Overdue';
  return totals.paid > 0 ? 'Partially paid' : 'Pending';
}
export function validateInvoice(invoice: AdminInvoice) {
  if (!invoice.number.trim() || !invoice.customerId || !invoice.service.trim()) throw new Error('Select a customer and enter an invoice number and service.');
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!validDate(invoice.issueDate) || !validDate(invoice.dueDate) || invoice.dueDate < invoice.issueDate) throw new Error('Enter valid dates. The due date cannot be before the issue date.');
  if (!invoice.lines.length || invoice.lines.some(line => !line.description.trim() || !Number.isFinite(line.quantity) || line.quantity <= 0 || !Number.isFinite(line.unitPrice) || line.unitPrice < 0)) throw new Error('Each line item needs a description, positive quantity and valid unit price.');
  const totals = invoiceTotals(invoice);
  if (!Number.isFinite(invoice.discount) || invoice.discount < 0 || invoice.discount > totals.subtotal || !Number.isFinite(invoice.taxRate) || invoice.taxRate < 0 || invoice.taxRate > 100 || !Number.isFinite(totals.total) || totals.total <= 0 || totals.total > 1e12) throw new Error('Check the discount, tax rate and invoice total. The total must be greater than zero.');
  if (invoice.receipts.some(receipt => !Number.isFinite(receipt.amount) || receipt.amount <= 0 || !validDate(receipt.date) || !paymentMethods.includes(receipt.method)) || totals.paid > totals.total) throw new Error('Payments must be valid positive amounts and cannot exceed the invoice total.');
}
export function addPayment(invoice: AdminInvoice, receipt: PaymentReceipt, today = new Date().toISOString().slice(0, 10)) {
  if (invoice.cancelled || invoiceStatus(invoice, today) === 'Paid') throw new Error('This invoice cannot receive another payment.');
  if (!receipt.date || receipt.date > today || receipt.date < invoice.issueDate) throw new Error('The payment date must be between the issue date and today.');
  if (receipt.reference.trim() && invoice.receipts.some(item => item.reference.toLowerCase() === receipt.reference.trim().toLowerCase())) throw new Error('This payment reference has already been recorded for this invoice.');
  const next = { ...invoice, receipts: [...invoice.receipts, receipt], events: [{ id: receipt.id, title: 'Payment recorded', detail: `${invoice.currency} ${receipt.amount.toFixed(2)} · ${receipt.method} payment recorded by Admin.`, date: receipt.created }, ...invoice.events] };
  validateInvoice(next); return next;
}
const services = ['Company Registration', 'Trademark Registration', 'Annual Returns', 'Business Name Search', 'Document Verification', 'Company Registration', 'Compliance Filing', 'Trademark Registration', 'Annual Returns', 'Company Registration'];
const amounts = [180000, 75000, 50000, 10000, 15000, 100000, 60000, 75000, 50000, 80000];
export const initialInvoices: AdminInvoice[] = services.map((service, index) => {
  // Preserve the company workspace's original three invoices and their relationships.
  const company = initialCompanies[index < 3 ? 0 : index - 2];
  const paid = [0, 3, 5, 7, 9].includes(index); const pending = [1, 6].includes(index);
  const date = index === 1 ? '2024-09-14' : index === 2 ? '2024-08-20' : '2024-09-12';
  const created = date + 'T09:00:00Z';
  return { id: `INV-${String(index + 1).padStart(3, '0')}`, number: `INV-${String(index + 1).padStart(3, '0')}`, customerId: company.owner.id, companyId: company.id, ...(index === 0 ? { applicationReference: 'APP-2024-001' } : {}), jurisdiction: company.jurisdiction, service, currency: 'NGN', issueDate: date, dueDate: pending ? '2026-12-31' : index === 0 ? '2024-09-19' : '2024-09-26', lines: [{ id: `line-${index}`, description: service, detail: '', quantity: 1, unitPrice: amounts[index] }], discount: 0, taxRate: 0, notes: '', created, createdBy: 'Admin', cancelled: false,
    receipts: paid ? [{ id: `receipt-${index}`, amount: amounts[index], method: 'Bank Transfer', date, reference: `SAMPLE-TRANSFER-${String(index + 1).padStart(3, '0')}`, notes: '', paidBy: company.owner.name, created: date + 'T14:34:00Z' }] : [],
    events: [{ id: `invoice-created-${index}`, title: 'Invoice created', detail: 'Invoice added to company records.', date: created }],
  };
});
export const invoiceServiceTemplates = [
  { service: 'Company Registration', description: 'Company registration fee', amount: 180000 },
  { service: 'Trademark Search', description: 'Initial search fee', amount: 25000 },
  { service: 'Trademark Registration', description: 'Registration filing fee', amount: 100000 },
  { service: 'Annual Returns', description: 'Annual returns filing', amount: 50000 },
  { service: 'Document Verification', description: 'Document verification fee', amount: 15000 },
];
