import { Suspense } from "react";
import { ConvertApplication } from "@/components/modules/Companies";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const value = (await params).id; return <Suspense fallback={<p className="p-6">Loading…</p>}><ConvertApplication id={value} /></Suspense>; }
