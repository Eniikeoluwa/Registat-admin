'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { companyTabs } from '@/data/admin/companies';
import { useCompanies } from './companyStore';
import { useApplications } from './applicationStore';
import CompanyList from './CompanyList';
import CompanyDetail from './CompanyDetail';
import NewCompanyModal from './NewCompanyModal';
export default function CompaniesWorkspace() {
  const companies = useCompanies(); const applications = useApplications(); const router = useRouter(); const segments = usePathname().split('/');
  const id = segments[3] && segments[3] !== 'new' ? decodeURIComponent(segments[3]) : undefined;
  const company = companies.find(item => item.id === id); const creating = segments[3] === 'new';
  const tab = companyTabs.find(value => value.toLowerCase() === segments[4]) ?? 'Overview';
  const [editing, setEditing] = useState(false);
  function openCompany(value: string) { setEditing(false); router.push(`/admin/companies/${encodeURIComponent(value)}`); }
  return <><div className="applications-workspace companies-workspace" hidden={!!id}><CompanyList companies={companies} /></div>
    {company && <CompanyDetail key={company.id} company={company} tab={tab} applications={applications.filter(app => app.companyId === company.id || (!app.companyId && app.companyName.trim().toLowerCase() === company.name.trim().toLowerCase() && app.customer.email.toLowerCase() === company.owner.email.toLowerCase()))} onEdit={() => setEditing(true)} />}
    {id && !company && <section className="company-missing"><h1>Company unavailable</h1><p>This company record could not be found in this browser.</p><Link className="application-button" href="/admin/companies">Back to companies</Link></section>}
    {(creating || (editing && company)) && <NewCompanyModal company={editing ? company : undefined} onClose={() => { setEditing(false); if (creating) router.push('/admin/companies', { scroll: false }); }} onView={openCompany} />}
  </>;
}
