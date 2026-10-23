import { PaymentDetail } from "@/components/modules/Payments";
export const metadata = { title: "Payment details" };
export default async function Page({ params }: { params: Promise<{ invoice: string }> }) { return <PaymentDetail reference={(await params).invoice} />; }
