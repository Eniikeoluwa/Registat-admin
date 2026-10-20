import { validateDraft } from "@/lib/api/validation";
export type Fields = Record<string, unknown>;
export type Member = { id: string; type: "individual" | "corporate"; firstName: string; lastName: string; companyName: string; email: string; phone: string; nationality: string; country: string; shares: number; roles: string[]; documentIds: string[] };
export const workflows: Record<string, string> = { "company-registration": "company_registration", trademark: "trademark_registration", licensing: "business_licensing", "bank-account": "bank_account_opening" };
export const flag = (code: string) => /^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map(c => c.charCodeAt(0) + 127397)) : "";
export function countryCode(value: string) { return ({ "united states": "US", "united kingdom": "GB", nigeria: "NG", canada: "CA", australia: "AU" } as Record<string, string>)[value.toLowerCase()] || value; }
export function phone(code: string, value: string) { return value.startsWith("+") ? value.replace(/[\s()-]/g, "") : `${code}${value.replace(/^0/, "")}`.replace(/[\s()-]/g, ""); }
export function shareValue(total: string, count: string) {
  if (!/^\d+(?:\.\d{1,2})?$/.test(total) || !/^[1-9]\d*$/.test(count)) throw new Error("Enter a positive share value and whole number of shares.");
  const [whole, decimal = ""] = total.split("."); const minor = BigInt(whole) * BigInt(100) + BigInt(decimal.padEnd(2, "0")); const shares = BigInt(count);
  if (!minor || minor % shares !== BigInt(0) || minor > BigInt(Number.MAX_SAFE_INTEGER) || shares > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("The total share value must divide into a whole number of cents per share, within the allowed maximum.");
  return Number(minor / shares);
}
export function stepDraft(path: string, fields: Fields, saved: Fields): Fields {
  const defaults: Record<string, string> = { "shares.currency": "USD", "applicant.countryCode": "+234", "applicant.contactCountryCode": "+234" };
  const val = (key: string) => String(fields[key] ?? defaults[key] ?? "").trim(); const optional = (key: string) => val(key) || undefined;
  const address = (prefix: string) => ({ country: countryCode(val(`${prefix}.country`)), stateOrProvince: val(`${prefix}.state`), city: val(`${prefix}.city`), postalCode: val(`${prefix}.zip`), addressLine: val(`${prefix}.street`) });
  if (path.endsWith("company/information")) return { proposedName: val("company.preferredName"), alternativeName: optional("company.altName"), entityType: val("company.companyType"), businessActivity: val("company.activity"), email: val("company.email"), phone: val("company.phone").replace(/[\s()-]/g, ""), registeredAddress: address("company"), totalShares: Number(val("shares.numberOfShares")), shareValueMinor: shareValue(val("shares.totalValue"), val("shares.numberOfShares")), shareCurrency: val("shares.currency") };
  if (path.endsWith("company/ownership")) {
    const members = (fields.members || []) as Member[];
    const common = (m: Member) => ({ email: m.email, phone: m.phone, ...(m.nationality ? { nationality: m.nationality } : {}) });
    return { shareholders: members.filter(m => m.roles.includes("Shareholder")).map(m => m.type === "corporate" ? { type: m.type, companyName: m.companyName, email: m.email, phone: m.phone, country: m.country, shares: m.shares } : { type: m.type, firstName: m.firstName, lastName: m.lastName, ...common(m), shares: m.shares }), directors: members.filter(m => m.roles.includes("Director")).map(m => ({ firstName: m.firstName, lastName: m.lastName, ...common(m) })), otherDocuments: [...new Set([...(saved.otherDocuments as string[] || []), ...members.flatMap(m => m.documentIds)])] };
  }
  if (path.endsWith("company/add-ons")) return { selectedAddOnIds: fields.addOns || [] };
  if (path.endsWith("trademark/applicant-information")) {
    const company = val("applicant.type") === "company";
    const names = val("applicant.contactName").split(/\s+/);
    return { applicantType: company ? "company" : "individual", ...(company ? { applicantCompanyName: val("applicant.companyName") } : {}), applicant: company ? { firstName: names[0] || "", lastName: names.slice(1).join(" "), email: val("applicant.contactEmail"), phone: phone(val("applicant.contactCountryCode"), val("applicant.contactPhone")) } : { firstName: val("applicant.firstName"), lastName: val("applicant.lastName"), middleName: optional("applicant.middleName"), email: val("applicant.email"), phone: phone(val("applicant.countryCode"), val("applicant.phone")), nationality: optional("applicant.nationality") }, applicantAddress: { country: countryCode(val("applicant.addrCountry")), stateOrProvince: val("applicant.addrState"), city: val("applicant.addrCity"), postalCode: val("applicant.addrZip"), addressLine: val("applicant.addrStreet") } };
  }
  if (path.endsWith("trademark/details")) {
    if (val("mark.type") === "text-and-logo") throw new Error("Combined marks are not supported. Choose Word Mark or Logo Mark.");
    return { markName: val("mark.name"), markDescription: val("mark.description"), markType: val("mark.type") === "logo" ? "logo_mark" : "word_mark" };
  }
  if (path.endsWith("trademark/documents")) return { additionalNotes: val("additional.notes") };
  if (path.endsWith("trademark/classes")) return { niceClasses: fields.classes || [] };
  if (path.endsWith("trademark/additional-info")) return { additionalNotes: val("additional.notes"), specialInstructions: val("additional.instructions") };
  return {};
}
export function clean(value: Fields) { return JSON.parse(JSON.stringify(value)) as Fields; }
export function checkDraft(workflow: string, value: Fields, submit = false) {
  const errors = validateDraft(workflow, clean(value), submit);
  if (Object.keys(errors).length) throw new Error(Object.entries(errors).map(([key, message]) => `${key}: ${message}`).join(" · "));
}
export function hydrate(workflow: string, draft: Fields): Fields {
  const obj = (key: string) => draft[key] as Fields || {}; const out: Fields = {};
  if (workflow === "company_registration") {
    for (const [ui, api] of Object.entries({ preferredName: "proposedName", altName: "alternativeName", companyType: "entityType", activity: "businessActivity", email: "email", phone: "phone" })) out[`company.${ui}`] = draft[api] || "";
    for (const [ui, api] of Object.entries({ country: "country", state: "stateOrProvince", city: "city", zip: "postalCode", street: "addressLine" })) out[`company.${ui}`] = obj("registeredAddress")[api] || "";
    out["shares.numberOfShares"] = draft.totalShares ? String(draft.totalShares) : ""; out["shares.totalValue"] = draft.totalShares && draft.shareValueMinor ? (Number(draft.totalShares) * Number(draft.shareValueMinor) / 100).toFixed(2) : ""; out["shares.currency"] = draft.shareCurrency || "USD"; out.addOns = draft.selectedAddOnIds || [];
    const members: Member[] = ((draft.shareholders || []) as Fields[]).map((m, i) => ({ id: `shareholder-${i}`, type: m.type as Member['type'], firstName: String(m.firstName || ""), lastName: String(m.lastName || ""), companyName: String(m.companyName || ""), email: String(m.email || ""), phone: String(m.phone || ""), nationality: String(m.nationality || ""), country: String(m.country || ""), shares: Number(m.shares), roles: ["Shareholder"], documentIds: [] }));
    for (const [i, m] of ((draft.directors || []) as Fields[]).entries()) { const found = members.find(item => item.type === "individual" && item.email === m.email && item.firstName === m.firstName && item.lastName === m.lastName); if (found) found.roles.push("Director"); else members.push({ id: `director-${i}`, type: "individual", firstName: String(m.firstName), lastName: String(m.lastName), companyName: "", email: String(m.email), phone: String(m.phone), nationality: String(m.nationality || ""), country: "", shares: 0, roles: ["Director"], documentIds: [] }); }
    out.members = members;
  } else {
    out["applicant.type"] = draft.applicantType || "individual"; out["applicant.companyName"] = draft.applicantCompanyName || "";
    for (const key of ["firstName", "lastName", "middleName", "email", "phone", "nationality"]) out[`applicant.${key}`] = obj("applicant")[key] || "";
    out["applicant.contactName"] = [obj("applicant").firstName, obj("applicant").lastName].filter(Boolean).join(" "); out["applicant.contactEmail"] = obj("applicant").email || ""; out["applicant.contactPhone"] = obj("applicant").phone || "";
    for (const [ui, api] of Object.entries({ addrCountry: "country", addrState: "stateOrProvince", addrCity: "city", addrZip: "postalCode", addrStreet: "addressLine" })) out[`applicant.${ui}`] = obj("applicantAddress")[api] || "";
    out["mark.name"] = draft.markName || ""; out["mark.description"] = draft.markDescription || ""; out["mark.type"] = draft.markType === "logo_mark" ? "logo" : "word"; out.classes = draft.niceClasses || []; out["additional.notes"] = draft.additionalNotes || ""; out["additional.instructions"] = draft.specialInstructions || "";
  }
  return out;
}

export function safeCheckoutUrl(value: string) { const url = new URL(value); if (url.protocol !== "https:" || !/^(?:[a-z0-9-]+\.)?paystack\.com$/i.test(url.hostname) || url.username || url.password) throw new Error("The payment service returned an invalid checkout link."); return url.href; }

export function onboardingHref(application: { _id: string; serviceType: string; currentStep: number; trademarkGroupId?: string }) {
  const company = application.serviceType === "company_registration";
  if (!company && application.serviceType !== "trademark_registration") return null;
  const steps = company ? ["information", "information", "information", "information", "ownership", "documents", "add-ons", "review"] : ["applicant-information", "applicant-information", "applicant-information", "applicant-information", "details", "classes", "documents", "additional-info", "review"];
  const step = steps[Math.min(application.currentStep, steps.length - 1)];
  return `/onboarding/${company ? "company" : "trademark"}/${step}?${application.trademarkGroupId ? `groupId=${application.trademarkGroupId}` : `applicationId=${application._id}`}`;
}

// Frontend entry parameters are separate from the backend create request.
export function startOnboardingHref(companyId?: string | null, serviceId?: string | null) {
  const query = new URLSearchParams({ new: "1" });
  if (companyId) query.set("companyId", companyId);
  if (serviceId) query.set("serviceId", serviceId);
  return `/onboarding/service?${query}`;
}
export function readJourneyEntry(query: URLSearchParams, stored: unknown) {
  const getId = (key: string) => { const value = query.get(key); if (value !== null && !/^[a-fA-F0-9]{24}$/.test(value)) throw new Error(`Invalid ${key}. Open onboarding from your dashboard or company page.`); return value || undefined; };
  const applicationId = getId("applicationId"), groupId = getId("groupId"), companyId = getId("companyId"), serviceId = getId("serviceId");
  if (applicationId && groupId) throw new Error("Choose an application or a trademark group, not both.");
  const explicitId = groupId || applicationId;
  if (query.get("new") === "1" && explicitId) throw new Error("A new application cannot also resume an existing application.");
  let resume = explicitId ? { id: explicitId, group: !!groupId } : null;
  const fresh = query.get("new") === "1" || !!serviceId || !!companyId;
  if (!resume && !fresh && stored && typeof stored === "object") { const saved = stored as { id?: unknown; group?: unknown }; if (typeof saved.id === "string" && /^[a-fA-F0-9]{24}$/.test(saved.id) && typeof saved.group === "boolean") resume = { id: saved.id, group: saved.group }; }
  return { companyId, serviceId, resume, fresh };
}
export function applicationStartRequest(input: { serviceId: string; workflow: string; countries: string[]; companyId?: string }) {
  if (!/^[a-fA-F0-9]{24}$/.test(input.serviceId)) throw new Error("Choose a valid catalogue service.");
  if (input.companyId !== undefined && !/^[a-fA-F0-9]{24}$/.test(input.companyId)) throw new Error("Choose a valid owned company.");
  if (!input.countries.length || input.countries.length > (input.workflow === "trademark_registration" ? 20 : 1) || new Set(input.countries).size !== input.countries.length || input.countries.some(country => !/^[A-Z]{2}$/.test(country))) throw new Error("Choose unique supported countries for this workflow.");
  const group = input.workflow === "trademark_registration" && input.countries.length > 1;
  const common = { serviceId: input.serviceId, ...(input.companyId ? { companyId: input.companyId } : {}) };
  return { group, endpoint: group ? "applications/trademarks" : "applications", body: group ? { ...common, countries: input.countries } : { ...common, country: input.countries[0] } };
}

export function onboardingStepHref(href: string, entry: { companyId?: string; serviceId?: string; id?: string; group?: boolean }) {
  if (!href.startsWith("/onboarding/")) return href;
  const url = new URL(href, "https://frontend.invalid");
  if (url.searchParams.get("new") === "1" || url.searchParams.has("applicationId") || url.searchParams.has("groupId")) return href;
  if (entry.companyId) url.searchParams.set("companyId", entry.companyId);
  if (entry.serviceId) url.searchParams.set("serviceId", entry.serviceId);
  if (entry.id) url.searchParams.set(entry.group ? "groupId" : "applicationId", entry.id);
  return `${url.pathname}${url.search}${url.hash}`;
}
