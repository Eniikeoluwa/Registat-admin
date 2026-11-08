import { RequirementDetail } from "@/components/modules/Compliance";
export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <RequirementDetail id={(await params).id} />; }
