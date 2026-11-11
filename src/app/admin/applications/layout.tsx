import { Suspense } from "react";
import ApplicationsWorkspace from "@/components/admin/design/ApplicationsWorkspace";
export default function Layout({ children }: { children: React.ReactNode }) { return <Suspense fallback={<p className="p-8">Loading applications…</p>}><ApplicationsWorkspace>{children}</ApplicationsWorkspace></Suspense>; }
