"use client";

import Link from "next/link";
import { AccountIdentity, AccountInitials, LogoutButton } from "@/components/auth/AccountIdentity";
import { usePathname } from "next/navigation";
import { Icon, Logo } from "./DashboardIcons";

const groups = [
  { label: "COMPANY MANAGEMENT", items: [["Dashboard", "/dashboard", "home"], ["Applications", "/applications", "applications"], ["Companies", "/companies", "building"], ["Documents", "/documents", "document"]] },
  { label: "OPERATIONS", items: [["Compliance", "/compliance", "compliance"], ["Billing", "#", "billing"]] },
  { label: "DISCOVER MORE", items: [["Add Ons", "/addons", "addons"]] },
  { label: "ACCOUNT", items: [["Settings", "/settings", "settings"]] },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <div className="min-h-screen bg-[#f7f8f9] text-[#121a2a] lg:flex">
    <div className="flex items-center justify-between border-b border-[#dfe3e5] bg-white px-5 py-4 lg:hidden"><Logo /><div className="flex items-center gap-3"><LogoutButton /><Icon name="bell" /><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c59b35] text-sm text-white"><AccountInitials /></span></div></div>
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 overflow-hidden border-r border-[#dfe3e5] bg-white lg:flex lg:flex-col">
      <div className="flex h-[68px] items-center border-b border-[#dfe3e5] px-5"><Logo /></div>
      <nav className="flex-1 space-y-5 px-3 py-7">
        {groups.map((group) => <div key={group.label}><p className="px-4 pb-2 text-[12px] font-bold tracking-[0.04em] text-[#87909b]">{group.label}</p><div className="space-y-1">{group.items.map(([label, href, icon]) => { const active = href !== "#" && (pathname === href || (href === "/dashboard" && pathname === "/dashboard/setup")); return <Link key={label} href={href} className={`flex h-10 items-center gap-3 rounded-lg px-4 text-[15px] font-medium transition ${active ? "bg-[#faf3df] text-[#121a2a]" : "text-[#73787d] hover:bg-[#f7f8f9]"}`}><Icon name={icon} className={active ? "text-[#172133]" : "text-[#7e8285]"} />{label}{(label === "Applications" || label === "Billing") && <span className="ml-auto h-2 w-2 rounded-full bg-[#c8271f]" />}</Link> })}</div></div>)}
      </nav>
      <div className="border-t border-[#dfe3e5] p-5"><div className="rounded-xl border border-[#dce5ef] bg-[#f8fafc] p-5"><p className="font-bold">Need help?</p><p className="mt-2 text-sm leading-6 text-[#697993]">Chat with our team or read our help center.</p><Icon name="arrow" className="float-right -mt-7" /></div><div className="mt-5 flex items-center gap-3 border-t border-[#edf0f2] pt-5"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f6f7f8] text-sm text-[#69717a]"><AccountInitials /></span><AccountIdentity /><Link href="/settings" aria-label="Account settings"><Icon name="settings" className="ml-auto text-[#6f7b8a]" /></Link></div><LogoutButton /></div>
    </aside>
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}

export function PageHeader({ title, subtitle, action, back }: { title: string; subtitle?: string; action?: React.ReactNode; back?: boolean }) {
  return <header className="border-b border-[#e8ebed] bg-[#fafbfc] px-5 py-5 sm:px-8 lg:px-10"><div className="mx-auto flex max-w-[1450px] items-center justify-between gap-4">{back ? <Link href="/dashboard" className="flex items-center gap-4 text-sm font-semibold"><span className="text-2xl">‹</span>Back to Dashboard</Link> : <div><h1 className="text-[26px] font-bold tracking-[-0.04em] sm:text-[30px]">{title}</h1>{subtitle && <p className="mt-1 text-sm text-[#6e7787] sm:text-[17px]">{subtitle}</p>}</div>}<div className="flex items-center gap-3"><Icon name="search" className="hidden h-5 w-5 sm:block" /><span className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#c59b35] text-sm text-white sm:flex"><AccountInitials /></span>{action}</div></div></header>;
}

export function DashboardButton({ children, variant = "primary", href, onClick }: { children: React.ReactNode; variant?: "primary" | "soft"; href?: string; onClick?: () => void }) { const className = `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${variant === "primary" ? "bg-[#087d3d] text-white hover:bg-[#066b34]" : "bg-[#f4f6f6] text-[#141b2b] hover:bg-[#e9eeee]"}`; return href ? <Link href={href} className={className}>{children}</Link> : <button type="button" onClick={onClick} className={className}>{children}</button>; }
