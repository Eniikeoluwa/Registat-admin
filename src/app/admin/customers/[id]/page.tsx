import { notFound } from "next/navigation";
import { UserDetail } from "@/components/modules/Users";
export const metadata = { title: "User details" };
export default async function UserPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; if (!/^[a-fA-F0-9]{24}$/.test(id)) notFound(); return <UserDetail key={id} id={id} />; }
