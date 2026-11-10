import { Suspense } from "react";
import CompaniesWorkspace from "@/components/admin/design/CompaniesWorkspace";
export default function Layout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<p className="p-8">Loading companies…</p>}><CompaniesWorkspace>{children}</CompaniesWorkspace></Suspense>; }
