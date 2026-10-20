"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import { schemas, validate, type Schema } from "@/lib/api/validation";
import DraftFields, { project } from "@/components/applications/DraftFields";
import { buttonClass, panelClass } from "@/components/applications/UI";
export type OptionsMap = Record<string, { value: string; label: string }[]>;
export default function SchemaEditor({ title, schemaName, endpoint, method = "POST", initial = {}, optionsMap, onSaved, onCancel, description, hidden = [] }: { title: string; schemaName: string; endpoint: string; method?: string; initial?: unknown; optionsMap?: OptionsMap; onSaved: (data: Record<string, unknown>) => void; onCancel?: () => void; description?: string; hidden?: string[] }) {
  const schema: Schema = { ...schemas[schemaName], properties: Object.fromEntries(Object.entries(schemas[schemaName].properties || {}).filter(([key]) => !hidden.includes(key))) };
  const [values, setValues] = useState<Record<string, unknown>>(() => project(schema, initial) as Record<string, unknown>);
  const [busy, setBusy] = useState(false); const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(""); const [reauth, setReauth] = useState(false);
  async function submit() {
    if (busy) return;
    const problems = validate(schema, values);
    if (typeof values.totalShares === "number" && Array.isArray(values.shareholders) && values.shareholders.reduce((sum, item) => sum + Number(item.shares || 0), 0) > values.totalShares) problems.shareholders = "Allocated shares cannot exceed total shares.";
    setErrors(problems); setError(""); if (Object.keys(problems).length) { setError("Please correct the highlighted fields."); return; }
    setBusy(true);
    try { const result = await api<Record<string, unknown>>(endpoint, { method, body: values }); onSaved(result.data); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to save."); if (error instanceof ApiError) { setErrors(error.errors); setReauth(error.status === 403 && /recent|fresh|log.?in|re.?auth/i.test(error.message)); } }
    finally { setBusy(false); }
  }
  return <form onSubmit={event => { event.preventDefault(); void submit(); }} noValidate className={`${panelClass} space-y-6`}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2>{onCancel && <button type="button" disabled={busy} onClick={onCancel} className="text-sm text-slate-500 underline">Close</button>}</div>{description && <p className="text-sm leading-6 text-slate-500">{description}</p>}{error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700"><p>{error}</p>{Object.entries(errors).map(([key, message]) => <p className="mt-1" key={key}>{key}: {message}</p>)}{reauth && <a className="mt-3 block font-semibold underline" href={`/login?next=${encodeURIComponent(typeof window === "undefined" ? "/admin/services" : window.location.pathname + window.location.search)}`}>Log in again to continue</a>}</div>}
    <DraftFields configuration schema={schema} value={values} onChange={next => setValues(next as Record<string, unknown>)} errors={errors} disabled={busy} applicationId="" documents={[]} setDocuments={() => {}} optionsMap={optionsMap} />
    <button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button>
  </form>;
}
