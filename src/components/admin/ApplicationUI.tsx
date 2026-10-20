import type { ReactNode } from "react";
import type { ApplicationStatus } from "@/data/admin/applications";
import AdminNavIcon from "./AdminNavIcon";

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`application-status ${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span>;
}

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return <label className="application-field"><span>{label}{required && <b aria-hidden="true"> *</b>}</span>{children}</label>;
}

export function SmallIcon({ name }: { name: string }) { return <AdminNavIcon name={name} />; }

export async function copyText(value: string) {
  if (!navigator.clipboard) throw new Error("Clipboard access is unavailable. Select and copy the reference number instead.");
  await navigator.clipboard.writeText(value);
}
