import { Suspense } from "react";
import { notFound } from "next/navigation";
import Compliance from "@/components/modules/Compliance";
export default async function Page({ params }: { params: Promise<{ status: string }> }) { const { status } = await params; if (!["pending", "in_progress", "filed", "completed", "archived"].includes(status)) notFound(); return <Suspense fallback={<p className="p-8">Loading filings…</p>}><Compliance selected={status} /></Suspense>; }
