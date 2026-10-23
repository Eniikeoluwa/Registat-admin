"use client";

import Link from "next/link";
import { useAccount, AccountInitials, LogoutButton } from "@/components/auth/AccountIdentity";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adminNavigation } from "@/data/admin/dashboard";
import AdminAsset from "./AdminAsset";
import AdminNavIcon from "./AdminNavIcon";
import { useApi } from "@/lib/api/client";
import type { AdminApplicationResponse, AdminCompanyResponse, AdminUserResponse } from "@/lib/api/types";
import Notifications from "@/components/modules/Notifications";


export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const applicationSearch = useApi<AdminApplicationResponse[]>(query.trim() ? `applications/admin?search=${encodeURIComponent(query.trim().slice(0, 100))}&limit=6` : null);
  const account = useAccount();
  const companySearch = useApi<AdminCompanyResponse[]>(query.trim() ? `companies/admin?search=${encodeURIComponent(query.trim().slice(0, 100))}&limit=6` : null);
  const companyMatches = companySearch.data || [];
  const customerSearch = useApi<AdminUserResponse[]>(query.trim() ? `users/admin?search=${encodeURIComponent(query.trim().slice(0, 100))}&limit=6` : null);
  const customerMatches = customerSearch.data || [];
  const matches = applicationSearch.data || [];

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape") { setQuery(""); setMenuOpen(false); }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  return <div className="admin-frame">
    <a href="#admin-content" className="admin-skip">Skip to content</a>
    {menuOpen && <button className="admin-nav-overlay" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <aside className={`admin-sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Admin sidebar">
      <Link href="/admin/dashboard" className="admin-brand" aria-label="Registat admin dashboard" onClick={() => setMenuOpen(false)}><AdminAsset name="logo" alt="Registat" /></Link>
      <nav aria-label="Admin navigation" className="admin-navigation">
        {adminNavigation.map((group) => <div key={group.label} className="admin-nav-group"><p>{group.label}</p><div>{group.items.map((item) => {
          const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return <Link key={item.path} href={item.path} aria-current={active ? "page" : undefined} className={`admin-nav-link ${active ? "is-active" : ""}`} onClick={() => setMenuOpen(false)}><AdminNavIcon name={item.icon} /><span>{item.label}</span></Link>;
        })}</div></div>)}
      </nav>
      <div className="admin-promo"><div><span className="admin-star"><AdminAsset name="star" /></span><strong>Registat Admin</strong><p>Manage global operations with ease.</p></div></div>
      <Link href="/admin/settings" className="admin-sidebar-profile"><span className="admin-avatar light">{account?.name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}</span><span><strong>{account?.name}</strong><small>{account?.email}</small></span><span className="admin-profile-settings"><AdminAsset name="profileSettings" /><i /></span></Link>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <button className="admin-mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label="Open navigation" aria-expanded={menuOpen}>☰</button>
        <div className="admin-search">
          <AdminAsset name="search" />
          <input ref={searchRef} aria-label="Search admin workspace" type="search" placeholder="Search for a customer, company, application or reference number..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <kbd>⌘ K</kbd>
          {query.trim() && <div className="admin-search-results"><p>Companies</p>{companyMatches.length ? companyMatches.slice(0, 6).map(company => <Link key={company._id} href={`/admin/companies/${company._id}`} onClick={() => setQuery("")}><strong>{company.name}</strong><span>{company.registrationNumber || company.country} · {company.jurisdiction}</span></Link>) : <p>{companySearch.loading ? "Searching companies…" : companySearch.error || "No matching companies."}</p>}<p>Customers</p>{customerMatches.length ? customerMatches.slice(0, 6).map(customer => <Link key={customer._id} href={`/admin/customers/${customer._id}`} onClick={() => setQuery("")}><strong>{customer.name}</strong><span>{customer.email}</span></Link>) : <p>{customerSearch.loading ? "Searching users…" : customerSearch.error || "No matching users."}</p>}<p>Applications</p>{matches.length ? matches.map((task) => <Link key={task._id} href={`/admin/applications/${task._id}`} onClick={() => setQuery("")}><strong>{task.reference}</strong><span>{task.userInfo?.name} · {task.serviceName}</span></Link>) : <p>{applicationSearch.loading ? "Searching applications…" : applicationSearch.error || "No matching applications."}</p>}</div>}
        </div>
        <div className="admin-topbar-actions">
          <details className="admin-dropdown"><summary aria-label="Notifications" className="admin-notification"><AdminAsset name="bell" /></summary><div className="admin-dropdown-panel"><strong>Notifications</strong><Notifications compact /><Link href="/admin/activity">View all notifications</Link></div></details>
          <details className="admin-dropdown"><summary className="admin-top-profile"><span className="admin-avatar"><AccountInitials /></span><span>{account?.name}</span><AdminAsset name="down" /></summary><div className="admin-dropdown-panel"><Link href="/admin/settings">Account settings</Link><LogoutButton /></div></details>
        </div>
      </header>
      <main id="admin-content">{children}</main>
    </div>
  </div>;
}
