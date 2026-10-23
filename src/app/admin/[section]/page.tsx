import { notFound } from "next/navigation";
import Notifications from "@/components/modules/Notifications";
export const metadata = { title: "Notifications" };
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  if ((await params).section !== "activity") notFound();
  return <main className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8"><h1 className="text-3xl font-bold">Notifications</h1><p>Updates sent to your admin account.</p><Notifications /></main>;
}
