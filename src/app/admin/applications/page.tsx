import { Suspense } from "react";
import ApplicationsList from "@/components/applications/ApplicationsList";
export const metadata = { title: "Applications" };
export default function Page() { return <Suspense fallback={<p className="p-6">Loading applications…</p>}><ApplicationsList admin /></Suspense>; }
