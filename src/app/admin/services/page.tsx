import { Suspense } from "react";
import CatalogueWorkspace from "@/components/modules/CatalogueWorkspace";
export default function Page() { return <Suspense fallback={<p className="p-6">Loading…</p>}><CatalogueWorkspace section="services" /></Suspense>; }
