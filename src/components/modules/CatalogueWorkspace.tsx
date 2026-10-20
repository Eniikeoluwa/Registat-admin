"use client";
import Link from "next/link";
import { useState } from "react";
import { api, useApi } from "@/lib/api/client";
import type { AdminCatalogResponse, CurrencySettingsResponse } from "@/lib/api/types";
import { label } from "@/lib/api/validation";
import { Empty, LoadState, buttonClass, panelClass, inputClass } from "@/components/applications/UI";
import SchemaEditor, { type OptionsMap } from "./SchemaEditor";
import { DataView, Pagination, Search, useFilters, money } from "./ModuleUI";
type Row = Record<string, unknown> & { _id: string };
const configuration: Record<string, { title: string; key: string; create: string; update: string; paginated: boolean }> = {
  countries: { title: "Countries", key: "countries", create: "CreateCountry", update: "UpdateCountry", paginated: true },
  services: { title: "Services", key: "services", create: "CreateService", update: "UpdateService", paginated: true },
  forms: { title: "Form presentations", key: "formDefinitions", create: "CreateFormDefinition", update: "UpdateFormDefinition", paginated: true },
  "nice-classes": { title: "Trademark classes", key: "niceClasses", create: "CreateNiceClass", update: "UpdateNiceClass", paginated: false },
  "add-ons": { title: "Add-ons", key: "addOns", create: "CreateAddOn", update: "UpdateAddOn", paginated: false },
  fees: { title: "Fees", key: "fees", create: "CreateFee", update: "UpdateFee", paginated: false },
};
const href = (section: string) => section === "countries" ? "/admin/jurisdictions" : section === "services" ? "/admin/services" : `/admin/catalog/${section}`;
export default function CatalogueWorkspace({ section = "services", id, create = false }: { section?: string; id?: string; create?: boolean }) {
  const filters = useFilters(); const config = configuration[section];
  const [editing, setEditing] = useState<string | null>(create ? "new" : id || null); const [notice, setNotice] = useState("");
  const query = new URLSearchParams(filters.search.toString()); query.set("limit", "20");
  const bundle = useApi<AdminCatalogResponse>("catalog/admin");
  const listing = useApi<Row[]>(config?.paginated ? `catalog/admin/${section}?${query}` : null);
  const detail = useApi<Row>(config?.paginated && editing && editing !== "new" ? `catalog/admin/${section}/${editing}` : null);
  const rates = useApi<CurrencySettingsResponse>(section === "currency" ? "catalog/currency-settings" : null);
  const activeRow = editing && editing !== "new" ? config?.paginated ? detail.data : (bundle.data as unknown as Record<string, Row[]> | undefined)?.[config?.key]?.find(row => row._id === editing) : undefined;
  const allRows = config?.paginated ? listing.data : (bundle.data as unknown as Record<string, Row[]> | undefined)?.[config?.key];
  const rows = config?.paginated ? allRows : allRows?.filter(row => (!filters.search.get("search") || JSON.stringify(row).toLowerCase().includes(filters.search.get("search")!.toLowerCase())) && (!filters.search.get("isActive") || String(row.isActive) === filters.search.get("isActive")));
  const services = bundle.data?.services.map(service => ({ value: service._id, label: service.name })) || [];
  const countries = bundle.data?.countries.map(country => ({ value: country.code, label: country.name })) || [];
  const options: OptionsMap = { serviceId: services, applicableServiceIds: services, supportedCountries: countries, ...(section !== "countries" ? { country: countries } : {}) };
  function saved() { setEditing(null); setNotice("Configuration saved successfully."); listing.reload(); bundle.reload(); rates.reload(); }
  async function setActive(row: Row) { try { await api(`catalog/admin/${section}/${row._id}`, { method: "PATCH", body: { isActive: !row.isActive } }); saved(); } catch (error) { setNotice(error instanceof Error ? error.message : "Unable to update configuration."); } }
  return <main className="mx-auto w-full max-w-[1280px] space-y-6 p-5 py-8 sm:px-8"><header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">{config?.title || "Exchange rates"}</h1><p className="mt-2 text-sm text-slate-500">Manage the live catalogue shown to customers.</p></div>{config && <button className={buttonClass} onClick={() => { setEditing("new"); setNotice(""); }}>＋ Create {section === "nice-classes" ? "class" : section === "countries" ? "country" : section === "forms" ? "form" : section.replace(/s$/, "")}</button>}</header>
    <nav className="flex flex-wrap gap-2">{[...Object.keys(configuration), "currency"].map(key => <Link key={key} href={href(key)} className={`rounded-lg px-4 py-2 text-sm ${section === key ? "bg-[#067939] text-white" : "border border-slate-200 bg-white"}`}>{configuration[key]?.title || "Exchange rates"}</Link>)}</nav>
    {notice && <p role="status" className="rounded-lg bg-slate-100 p-4 text-sm">{notice}</p>}
    <LoadState {...bundle} retry={bundle.reload} />
    {section === "currency" && <><LoadState {...rates} retry={rates.reload} />{rates.data && <><section className={panelClass}><h2 className="mb-3 font-bold">Current collection currencies</h2><p className="text-sm">Base: {rates.data.baseCurrency} · Supported: {rates.data.supportedCurrencies.join(", ")}</p><div className="mt-4"><DataView data={rates.data.rates || "Rates have not been configured."} /></div></section><SchemaEditor title="Update exchange rates" schemaName="UpdateCurrencyRates" endpoint="catalog/admin/currency-settings" method="PATCH" initial={rates.data.rates || {}} description="Enter NGN per USD for both directions. USD to NGN multiplies; NGN to USD divides. Updates affect new quotes only. A recent login is required." onSaved={saved} /></>}</>}
    {config && <>
      {editing && <><LoadState {...detail} retry={detail.reload} />{(editing === "new" || activeRow) && <SchemaEditor key={`${section}-${editing}-${activeRow?.updatedAt || ""}`} title={editing === "new" ? `Create ${config.title.toLowerCase()}` : `Edit ${String(activeRow?.name || activeRow?.label || config.title)}`} schemaName={editing === "new" ? config.create : config.update} endpoint={`catalog/admin/${section}${editing === "new" ? "" : `/${editing}`}`} method={editing === "new" ? "POST" : "PATCH"} initial={editing === "new" ? { isActive: true } : activeRow} optionsMap={options} onSaved={saved} onCancel={() => setEditing(null)} description={section === "forms" ? "Configure display labels, steps, options and document roles. Service, country and version are fixed after creation. Validation rules are managed by the application." : undefined} />}</>}
      <Search value={filters.search.get("search") || ""} onSearch={search => filters.update({ search })} placeholder={`Search ${config.title.toLowerCase()}…`} />
      <div className="flex gap-4"><label className="text-sm">Visibility<select value={filters.search.get("isActive") || ""} onChange={event => filters.update({ isActive: event.target.value })} className={inputClass}><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></label><button className="self-end py-3 text-sm text-[#067939] underline" onClick={filters.reset}>Clear filters</button></div>
      <LoadState {...listing} retry={listing.reload} />
      <div className="grid gap-4 md:grid-cols-2">{rows?.map(row => <article key={row._id} className={panelClass}><div className="flex items-start justify-between gap-3"><div><h2 className="font-bold">{String(row.name || row.label || (row.version ? `Version ${row.version} · ${row.country}` : row.code || config.title))}</h2><p className="mt-2 text-sm text-slate-500">{String(row.description || row.country || row.code || "")}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${row.isActive ? "bg-green-50 text-green-800" : "bg-slate-100 text-slate-500"}`}>{row.isActive ? "Active" : "Inactive"}</span></div>{typeof row.amountMinor === "number" && <p className="mt-3 font-semibold">{money(row.amountMinor, String(row.currency || "USD"))}</p>}{row.workflowType !== undefined && <p className="mt-3 text-sm">{label(String(row.workflowType))} · {String(row.totalSteps)} steps</p>}{Array.isArray(row.supportedCountries) && <p className="mt-2 text-sm text-slate-500">{row.supportedCountries.join(", ")}</p>}<div className="mt-4 flex gap-5"><button onClick={() => { setEditing(row._id); setNotice(""); }} className="text-sm font-semibold text-[#067939]">View / edit</button><button onClick={() => void setActive(row)} className="text-sm text-slate-600 underline">{row.isActive ? "Deactivate" : "Activate"}</button></div></article>)}</div>
      {rows?.length === 0 && <Empty title={`No ${config.title.toLowerCase()} found`} description="Create a configuration entry or adjust your filters." />}
      {config.paginated && <Pagination value={listing.pagination} onPage={page => filters.update({ page: String(page) })} />}
    </>}
  </main>;
}
