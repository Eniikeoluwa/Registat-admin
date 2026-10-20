import { Suspense } from "react";
import CatalogueWorkspace from "@/components/modules/CatalogueWorkspace";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const value = (await params).id; return <Suspense fallback={<p className="p-6">Loading…</p>}><CatalogueWorkspace key={value} section="countries" id={value} /></Suspense>; }
