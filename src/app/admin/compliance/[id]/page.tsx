import { ComplianceDetail } from "@/components/modules/Compliance";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <ComplianceDetail id={(await params).id} />; }
