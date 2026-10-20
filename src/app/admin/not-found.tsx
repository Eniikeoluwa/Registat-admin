import Link from "next/link";

export default function AdminNotFound() {
  return <div className="admin-section-page"><h1>Page not found</h1><p>This admin page or application could not be found.</p><Link href="/admin/dashboard" className="admin-button primary">Back to dashboard</Link></div>;
}
