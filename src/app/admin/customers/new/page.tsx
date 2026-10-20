import Link from "next/link";
export const metadata = { title: "Customer registration" };
export default function NewCustomerPage() { return <main className="mx-auto max-w-3xl space-y-4 p-8"><Link href="/admin/customers" className="text-[#067939]">← All users</Link><h1 className="text-2xl font-bold">Customer registration</h1><p>Customers create their accounts in the customer app. Admin account creation and invitations are currently unavailable.</p></main>; }
