import type { Customer } from './applications';
export const companyStatuses = ['Active', 'Pending', 'Inactive', 'Suspended'] as const;
export type CompanyStatus = typeof companyStatuses[number];
export const companyEntityTypes = ['Private Limited Company', 'Public Limited Company', 'Sole Proprietorship', 'Non-Profit Organisation', 'Partnership'];
export const companyTabs = ['Overview', 'Applications', 'Documents', 'Compliance', 'Payments', 'Activity'] as const;
export type CompanyTab = typeof companyTabs[number];
export type CompanyDocument = { id: string; name: string; type: string; size: number; uploadedBy: string; date: string; status: 'Pending' | 'Verified' | 'Rejected'; fileKey?: string };
export type CompanyPerson = { id: string; name: string; role: string; percentage: number };
export type CompanyEvent = { id: string; title: string; description: string; date: string };
export type CompanyFiling = { id: string; title: string; authority: string; due: string; completed?: string };
export type CompanyInvoice = { id: string; description: string; amount: number; currency: string; date: string; status: 'Paid' | 'Pending' | 'Overdue' };
export type AdminCompany = {
  id: string; name: string; rc: string; entityType: string; jurisdiction: string; registrationDate: string;
  status: CompanyStatus; owner: Customer & { id: string }; address: string; businessAddress: string;
  activity: string; commencementDate: string; shareholding: boolean; capital: number; shares: number; currency: string;
  people: CompanyPerson[]; customPricing: boolean; governmentFee: number; serviceFee: number; notes: string;
  documents: CompanyDocument[]; filings: CompanyFiling[]; invoices: CompanyInvoice[]; events: CompanyEvent[];
};
export const documentTypes = ['Certificate of Incorporation', 'Memorandum & Articles', 'Director Identification', 'Proof of Address', 'Shareholders Register', 'Other'];
const names = ['Zuri Technologies Limited', 'GreenField Farms Ltd', 'BrightPath Education Limited', 'Luxe & Co.', 'HealthBridge Initiative', 'Koya Media Limited', 'Maple Consulting', 'Nova Retail Limited', 'Silva Properties'];
const owners = ['Tunde Adebayo', 'Chiamaka Nwosu', 'Femi Oladipo', 'Aisha Bello', 'Daniel Eze', 'Funmi Adekunle', 'Ibrahim Musa', 'Yinka Oseni', 'Fatima Yusuf'];
const dates = ['2024-09-12', '2024-09-03', '2024-08-28', '2024-08-20', '2024-08-15', '2024-08-10', '2024-08-05', '2024-08-01', '2024-07-28'];
export const initialCompanies: AdminCompany[] = names.map((name, index) => {
  const owner = { id: index === 3 ? 'customer-8' : `company-owner-${index + 1}`, name: owners[index], email: index === 3 ? 'aisha@example.com' : `${owners[index].toLowerCase().replaceAll(' ', '.')}@example.com`, phone: '+234 801 234 5678' };
  const date = dates[index] + 'T09:00:00Z';
  return {
    id: index === 0 ? 'zuri-technologies-limited' : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''),
    name, rc: `RC ${[2093347, 1987654, 2011122, 1876543, 1765432, 1654321, 1543210, 1432109, 1321098][index]}`,
    entityType: companyEntityTypes[[0, 0, 1, 2, 3, 0, 4, 0, 1][index]], jurisdiction: 'Nigeria', registrationDate: date,
    status: index === 2 || index === 6 ? 'Pending' : index === 5 ? 'Suspended' : 'Active', owner,
    address: index === 0 ? '23 Adeola Odeku Street, Victoria Island, Lagos' : '', businessAddress: '',
    activity: index === 0 ? 'Software Development' : '', commencementDate: '', shareholding: true, capital: 1000000, shares: 1000000, currency: 'NGN',
    people: [{ id: `person-${index}`, name: owner.name, role: 'Director, Shareholder', percentage: 100 }], customPricing: false, governmentFee: 0, serviceFee: 0, notes: '',
    documents: index === 0 ? ['CAC Certificate.pdf', 'Memorandum & Articles.pdf', 'Director’s ID.pdf', 'Proof of Address.pdf', 'Shareholders Register.pdf'].map((filename, i) => ({ id: `zuri-doc-${i}`, name: filename, type: documentTypes[i], size: [1200000, 2400000, 850000, 640000, 1100000][i], uploadedBy: i === 0 ? 'Registat' : owner.name, date, status: i === 2 ? 'Pending' : i === 4 ? 'Rejected' : 'Verified' })) : [],
    filings: index === 0 ? [
      { id: 'annual-return', title: 'Annual return filing', authority: 'Corporate Affairs Commission', due: '2026-10-27' },
      { id: 'confirmation', title: 'Confirmation statement', authority: 'Corporate Affairs Commission', due: '2026-11-10' },
      { id: 'vat', title: 'VAT return', authority: 'Federal Inland Revenue Service', due: '2026-12-21' },
      { id: 'incorporation', title: 'Certificate of incorporation', authority: 'Corporate Affairs Commission', due: '2024-09-12', completed: '2024-09-12' },
      { id: 'business-name', title: 'Business name registration', authority: 'Corporate Affairs Commission', due: '2025-02-02', completed: '2025-02-02' },
    ] : [],
    invoices: index === 0 ? [
      { id: 'INV-001', description: 'Company Registration', amount: 180000, currency: 'NGN', date: '2024-09-12', status: 'Paid' },
      { id: 'INV-002', description: 'Trademark Registration', amount: 75000, currency: 'NGN', date: '2024-09-14', status: 'Pending' },
      { id: 'INV-003', description: 'Annual Returns', amount: 50000, currency: 'NGN', date: '2024-08-20', status: 'Overdue' },
    ] : [],
    events: [{ id: `created-${index}`, title: 'Company created', description: `Company was created and linked to ${owner.name}.`, date }, ...(index === 0 ? [{ id: 'payment', title: 'Payment received', description: 'Invoice INV-001 for ₦180,000 was paid.', date: '2024-09-17T09:00:00Z' }, { id: 'verified', title: 'Document verified', description: 'CAC Certificate.pdf was verified by Registat.', date: '2024-09-20T09:00:00Z' }] : [])],
  };
});
export function money(amount: number, currency = 'NGN') { return new Intl.NumberFormat('en-NG', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount); }
export function fileSize(size: number) { return size >= 1000000 ? `${(size / 1000000).toFixed(1)} MB` : `${Math.ceil(size / 1000)} KB`; }
