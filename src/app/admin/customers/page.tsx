import { Suspense } from "react";
import { Users } from "@/components/modules/Users";
export const metadata = { title: "Users" };
export default function UsersPage() { return <Suspense fallback={<p className="p-8">Loading users…</p>}><Users /></Suspense>; }
