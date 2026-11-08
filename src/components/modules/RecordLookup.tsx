"use client";
import { useState } from "react";
import { useApi } from "@/lib/api/client";
import { useAccount } from "@/components/auth/AccountIdentity";
import { can, isStaff } from "@/lib/auth/permissions";
import { inputClass, LoadState } from "@/components/applications/UI";
import { Pagination } from "./ModuleUI";
const configuration: Record<string, { endpoint: string; permission: string; title: string; search?: boolean }> = {
  userId: { endpoint: "users/admin/customers", permission: "users:read", title: "Customer", search: true },
  ownerUserId: { endpoint: "users/admin/customers", permission: "users:read", title: "Company owner", search: true },
  applicationId: { endpoint: "applications/admin", permission: "applications:read", title: "Application", search: true },
  companyId: { endpoint: "companies/admin", permission: "companies:read", title: "Company", search: true },
  requirementId: { endpoint: "compliance/admin/requirements", permission: "compliance:read", title: "Requirement", search: true },
  assignedTo: { endpoint: "users/admin", permission: "users:read", title: "Assigned staff", search: true },
  documentId: { endpoint: "documents/admin", permission: "documents:read", title: "Document" },
  documentIds: { endpoint: "documents/admin", permission: "documents:read", title: "Documents" },
  avatarDocumentId: { endpoint: "documents/admin", permission: "documents:read", title: "Profile image" },
};
export const hasLookup = (key: string) => !!configuration[key];
export default function RecordLookup({ field, value, onChange, disabled, scope = {} }: { field: string; value: unknown; onChange: (value: unknown) => void; disabled: boolean; scope?: Record<string, unknown> }) {
  const account = useAccount(); const config = configuration[field]; const [search, setSearch] = useState(""); const [page, setPage] = useState(1); const [staffRole, setStaffRole] = useState("subAdmin");
  const staff = field === "assignedTo"; const selfOnly = staff && account?.role !== "superAdmin";
  const query = new URLSearchParams({ page: String(page), limit: "10" });
  if (config.search && search) query.set("search", search);
  if (staff) { query.set("role", staffRole); query.set("accountStatus", "active"); }
  if (["userId", "ownerUserId"].includes(field)) query.set("accountStatus", "active");
  if (field === "applicationId" && typeof scope.userId === "string") query.set("userId", scope.userId);
  if (field === "companyId" && typeof scope.userId === "string") query.set("ownerUserId", scope.userId);
  if (["documentId", "documentIds", "avatarDocumentId"].includes(field)) for (const key of ["userId", "companyId", "applicationId"]) if (typeof scope[key] === "string") query.set(key, scope[key] as string);
  if (field === "requirementId") query.set("isActive", "true");
  const resource = useApi<Record<string, unknown>[]>(can(account, config.permission) && !selfOnly ? `${config.endpoint}?${query}` : null);
  const selected = Array.isArray(value) ? value as string[] : typeof value === "string" ? [value] : [];
  const rows = selfOnly && account ? [{ ...account }] : staff && account && !resource.data?.some(row => row._id === account._id) ? [{ ...account }, ...(resource.data || [])] : resource.data || [];
  function select(id: string, checked: boolean) { onChange(field === "documentIds" ? checked ? [...selected.filter(value => value !== id), id] : selected.filter(value => value !== id) : checked ? id : undefined); }
  return <fieldset className="space-y-3 rounded-lg border border-slate-200 p-3"><legend className="px-2 text-sm font-semibold">{config.title}</legend>{staff && !selfOnly && <label className="block text-sm">Staff role<select className={inputClass} value={staffRole} onChange={event => { setPage(1); setStaffRole(event.target.value); }}><option value="subAdmin">Sub-admins</option><option value="superAdmin">Super admins</option></select></label>}{config.search && !selfOnly && <input disabled={disabled} className={inputClass} placeholder={`Find ${config.title.toLowerCase()}`} aria-label={`Find ${config.title.toLowerCase()}`} value={search} onChange={event => { setPage(1); setSearch(event.target.value); }} />}<LoadState {...resource} retry={resource.reload} />{rows.filter(row => (!staff || isStaff({ role: String(row.role) })) && (field !== "avatarDocumentId" || row.resourceType === "image") && !(["documentIds", "documentId"].includes(field) && row.reviewStatus === "rejected")).map(row => <label key={String(row._id)} className="flex items-start gap-2 text-sm"><input disabled={disabled} type={field === "documentIds" ? "checkbox" : "radio"} checked={selected.includes(String(row._id))} onChange={event => select(String(row._id), event.target.checked)} /><span>{String(row.originalFileName || row.name || row.title || row.reference || row.code || row._id)}{row.email ? ` · ${row.email}` : ""}</span></label>)}{!resource.loading && !rows.length && <p className="text-sm text-slate-500">No matching records available.</p>}{selected.length > 0 && <div className="space-y-2">{selected.map(id => <p key={id} className="break-all text-xs text-slate-500">{String(rows.find(row => row._id === id)?.originalFileName || rows.find(row => row._id === id)?.name || rows.find(row => row._id === id)?.title || `Selected record: ${id}`)} <button disabled={disabled} type="button" className="underline" onClick={() => select(id, false)}>Remove</button></p>)}</div>}{selfOnly && <label className="block text-xs text-slate-500">Other staff record ID (the API does not provide a staff directory for your role)<input disabled={disabled} className={inputClass} pattern="[a-fA-F0-9]{24}" value={typeof value === "string" && value !== account?._id ? value : ""} onChange={event => onChange(event.target.value || undefined)} /></label>}<Pagination value={resource.pagination} onPage={setPage} /></fieldset>;
}
