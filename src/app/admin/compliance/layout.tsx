import { Suspense } from "react";
import ComplianceDesign from "@/components/admin/design/ComplianceDesign";
export default function Layout({children}:{children:React.ReactNode}) { return <Suspense fallback={<p className="p-6">Loading compliance…</p>}><ComplianceDesign>{children}</ComplianceDesign></Suspense>; }
