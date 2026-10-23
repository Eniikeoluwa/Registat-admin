import { Suspense } from "react";
import { Payments } from "@/components/modules/Payments";
export const metadata = { title: "Payments" };
export default function Page() { return <Suspense fallback={<p className="p-6">Loading payments…</p>}><Payments /></Suspense>; }
