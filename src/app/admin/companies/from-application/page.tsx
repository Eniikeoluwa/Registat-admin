import { Suspense } from "react";
import { ConvertApplication } from "@/components/modules/Companies";
export default function Page() { return <Suspense fallback={<p className="p-6">Loading…</p>}><ConvertApplication  /></Suspense>; }
