import { Suspense } from "react";
import { notFound } from "next/navigation";
import CatalogueWorkspace from "@/components/modules/CatalogueWorkspace";
export default async function Page({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; if (!["countries", "services", "forms", "nice-classes", "add-ons", "fees", "currency"].includes(section)) notFound(); return <Suspense fallback={<p className="p-6">Loading catalogue…</p>}><CatalogueWorkspace key={section} section={section} /></Suspense>; }
