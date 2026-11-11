import { Suspense } from "react";
import CustomersWorkspace from "@/components/admin/design/CustomersWorkspace";
export default function Layout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<p className="p-8">Loading customers…</p>}><CustomersWorkspace>{children}</CustomersWorkspace></Suspense>; }
