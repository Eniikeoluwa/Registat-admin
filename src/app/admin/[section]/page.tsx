import Link from "next/link";
import { notFound } from "next/navigation";
import AdminAsset from "@/components/admin/AdminAsset";
import { activities, adminNavigation } from "@/data/admin/dashboard";

type Props = { params: Promise<{ section: string }> };

function sectionTitle(section: string) {
  return section === "activity" ? "Recent Activity" : adminNavigation.flatMap((group) => group.items).find((item) => item.path === `/admin/${section}`)?.label;
}

export async function generateMetadata({ params }: Props) {
  return { title: sectionTitle((await params).section) ?? "Not found" };
}

export default async function AdminSectionPage({ params }: Props) {
  const { section } = await params;
  const title = sectionTitle(section);
  if (!title) notFound();
  return <div className="admin-section-page"><h1>{title}</h1>{section === "activity" ? <>
    <p>The latest updates across Registat.</p><section className="admin-panel"><ul className="admin-activity-list">{activities.map((activity) => <li key={activity.title}><span className="admin-activity-icon" style={{ background: activity.color }}><AdminAsset name={activity.icon} /></span><div><strong>{activity.title}</strong><p>{activity.description}</p></div><span className="admin-activity-time">{activity.time}</span></li>)}</ul></section>
  </> : <><p>Manage {title.toLowerCase()} across Registat.</p><section className="admin-panel"><h2 className="text-base font-semibold">{title} workspace</h2><p className="admin-empty">This section is coming soon.</p><Link className="admin-text-link" href="/admin/dashboard">Back to dashboard →</Link></section></>}</div>;
}
