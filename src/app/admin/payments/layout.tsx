import { Suspense } from 'react';
import PaymentsWorkspace from '@/components/admin/PaymentsWorkspace';
export default function PaymentsLayout({ children }: { children: React.ReactNode }) { return <><Suspense fallback={<p className="admin-empty">Loading payments…</p>}><PaymentsWorkspace /></Suspense>{children}</>; }
