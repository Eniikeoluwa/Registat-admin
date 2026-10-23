import Link from "next/link";
export default function UnsupportedFeature({ title, description }: { title: string; description: string }) {
  return <section className="m-6 rounded-xl border border-slate-200 bg-white p-8"><h1 className="text-2xl font-bold">{title}</h1><p className="my-4 text-slate-600">{description}</p><Link className="text-[#067939] underline" href="/admin/dashboard">Back to dashboard</Link></section>;
}
