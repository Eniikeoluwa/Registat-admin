import { Suspense } from "react";
import PaymentsDesign from "@/components/admin/design/PaymentsDesign";

export default function PaymentsLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<p className="p-6">Loading payments…</p>}><PaymentsDesign>{children}</PaymentsDesign></Suspense>;
}
