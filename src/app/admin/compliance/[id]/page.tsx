import ComplianceDetail from '@/components/admin/ComplianceDetail';
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ action?: string }> }) { const [{ id }, { action }] = await Promise.all([params, searchParams]); return <ComplianceDetail id={id} action={action} />; }
