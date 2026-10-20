import ApplicationDetail from "@/components/applications/ApplicationDetail";
export const metadata = { title: "Application review" };
export default async function Page({ params }: { params: Promise<{ reference: string }> }) { return <ApplicationDetail id={(await params).reference} admin />; }
