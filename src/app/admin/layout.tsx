import { AccountProvider } from "@/components/auth/AccountIdentity";
import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import AdminShell from "@/components/admin/AdminShell";
import "./admin.css";
import "./applications.css";
import "./customers.css";
import "./companies.css";
import "./payments.css";
import "./services.css";
import "./jurisdictions.css";
import "./compliance.css";
import "./settings.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-admin-heading" });

export const metadata: Metadata = {
  title: { default: "Admin | Registat", template: "%s | Registat Admin" },
  description: "Manage Registat applications, customers, and global operations.",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${dmSans.variable} admin-workspace`}><AccountProvider><AdminShell>{children}</AdminShell></AccountProvider></div>;
}
