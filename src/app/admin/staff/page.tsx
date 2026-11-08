import { Suspense } from "react";
import { Users } from "@/components/modules/Users";
export default function Page() { return <Suspense fallback={<p className="p-8">Loading staff…</p>}><Users staff /></Suspense>; }
