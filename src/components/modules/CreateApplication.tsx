"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApi } from "@/lib/api/client";
import type { ClientCatalogResponse, AdminUserResponse, AdminCompanyResponse } from "@/lib/api/types";
import { LoadState, inputClass } from "@/components/applications/UI";
import SchemaEditor from "./SchemaEditor";
import { Permit } from "./ApiControls";
export default function CreateApplication() {
  const router = useRouter(); const [search, setSearch] = useState(""); const [owner, setOwner] = useState("");
  const catalogue = useApi<ClientCatalogResponse>("catalog");
  const customers = useApi<AdminUserResponse[]>(`users/admin/customers?limit=20&accountStatus=active${search ? `&search=${encodeURIComponent(search)}` : ""}`);
  const companies = useApi<AdminCompanyResponse[]>(owner ? `companies/admin?ownerUserId=${owner}&limit=100` : null);
  return <main className="mx-auto max-w-4xl space-y-5 p-5 sm:p-8"><Link className="text-[#067939]" href="/admin/applications">← All applications</Link><Permit permission="applications:write"><LoadState {...catalogue} retry={catalogue.reload} /><label className="block text-sm">Find customer<input className={inputClass} value={search} onChange={event => setSearch(event.target.value)} placeholder="Name or email" /></label><LoadState {...customers} retry={customers.reload} /><label className="block text-sm">Customer<select className={inputClass} value={owner} onChange={event => setOwner(event.target.value)}><option value="">Choose a customer</option>{customers.data?.map(user => <option key={user._id} value={user._id}>{user.name} · {user.email}</option>)}</select></label>{owner && <SchemaEditor key={owner} title="Start customer application" schemaName="AdminCreateApplication" endpoint="applications/admin" initial={{ userId: owner }} optionsMap={{ userId: [{ value: owner, label: customers.data?.find(user => user._id === owner)?.name || owner }], serviceId: catalogue.data?.services.map(service => ({ value: service._id, label: service.name })) || [], country: catalogue.data?.countries.map(country => ({ value: country.code, label: country.name })) || [], companyId: companies.data?.map(company => ({ value: company._id, label: company.name })) || [] }} description="This creates a customer-owned draft. The customer continues collection and submits it; no payment or completed status is manufactured." onSaved={application => router.push(`/admin/applications/${application._id}`)} />}</Permit></main>;
}
