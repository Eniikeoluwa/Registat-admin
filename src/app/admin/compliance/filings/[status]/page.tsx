import ComplianceWorkspace from '@/components/admin/ComplianceWorkspace';
import type { FilingStatus } from '@/data/admin/compliance';
import { notFound } from 'next/navigation';
const values: Record<string, FilingStatus | 'All filings'> = { all: 'All filings', overdue: 'Overdue', 'action-required': 'Action Required', upcoming: 'Upcoming', compliant: 'Compliant', archived: 'Archived' };
export default async function Page({ params }: { params: Promise<{ status: string }> }) { const { status } = await params; if (!values[status]) notFound(); return <ComplianceWorkspace key={status} view="list" selected={values[status]} />; }
