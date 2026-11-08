import type { AdminPermission } from "@/lib/api/types";
export type StaffIdentity = { role: string; permissions?: AdminPermission[] };
export function isStaff(user: StaffIdentity | null | undefined) { return user?.role === "superAdmin" || user?.role === "subAdmin"; }
export function can(user: StaffIdentity | null | undefined, permission: string) { return isStaff(user) && !!user?.permissions?.includes(permission as AdminPermission); }
export function landingPage(user: StaffIdentity | null | undefined) {
  for (const [permission, path] of [["dashboard:read", "dashboard"], ["applications:read", "applications"], ["users:read", "customers"], ["companies:read", "companies"], ["payments:read", "payments"], ["compliance:read", "compliance"], ["catalog:read", "services"]]) if (can(user, permission)) return `/admin/${path}`;
  return "/admin/settings";
}
export function sectionPermission(path: string) {
  if (path.startsWith("/admin/catalog/currency")) return "currency-rates:write";
  const section = path.split("/")[2];
  return ({ dashboard: "dashboard:read", activity: "dashboard:read", customers: "users:read", companies: "companies:read", applications: "applications:read", payments: "payments:read", services: "catalog:read", jurisdictions: "catalog:read", catalog: "catalog:read", documents: "documents:read", compliance: "compliance:read" } as Record<string, string>)[section];
}
