import type { Metadata } from 'next';
import AdminSettingsPage from '@/components/admin/AdminSettingsPage';
export const metadata: Metadata = { title: 'Account settings' };
export default function Page() { return <AdminSettingsPage />; }
