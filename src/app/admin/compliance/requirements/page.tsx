import { Suspense } from "react";
import Compliance from "@/components/modules/Compliance";
export default function Page() { return <Suspense fallback={<p className="p-8">Loading requirements…</p>}><Compliance requirements /></Suspense>; }
