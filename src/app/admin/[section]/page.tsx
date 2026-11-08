import { notFound } from "next/navigation";
import StaffActivity from "@/components/modules/StaffActivity";
export const metadata = { title: "Activity" };
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  if ((await params).section !== "activity") notFound();
  return <main className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8"><h1 className="text-3xl font-bold">Recent activity</h1><p>Activity across your permitted sections.</p><StaffActivity /></main>;
}
