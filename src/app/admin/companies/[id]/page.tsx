import { Suspense } from "react";
import { CompanyDetail } from "@/components/modules/Companies";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const value = (await params).id; return <Suspense fallback={<p className="p-6">Loading…</p>}><CompanyDetail id={value} admin /></Suspense>; }
