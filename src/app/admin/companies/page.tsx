import { Suspense } from "react";
import { Companies } from "@/components/modules/Companies";
export default function Page() { return <Suspense fallback={<p className="p-6">Loading…</p>}><Companies admin /></Suspense>; }
