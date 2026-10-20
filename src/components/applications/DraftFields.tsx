"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api/client";
import type { ClientCatalogResponse, StoredDocumentResponse, UploadedDocumentResponse } from "@/lib/api/types";
import { label, resolve, type Schema } from "@/lib/api/validation";
import { inputClass } from "./UI";
export function project(schemaInput: Schema, value: unknown): unknown {
  let schema = resolve(schemaInput);
  if (schema.anyOf) schema = choose(schema, value);
  if (schema.type === "object") {
    const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return Object.fromEntries(Object.entries(schema.properties || {}).filter(([key]) => source[key] !== undefined).map(([key, child]) => [key, project(child, source[key])]));
  }
  if (schema.type === "array" && Array.isArray(value)) return value.map(item => project(schema.items!, item));
  return value;
}
function choices(schema: Schema): unknown[] | undefined { return schema.enum || (schema.anyOf?.every(choice => choice.const !== undefined) ? schema.anyOf.map(choice => choice.const) : undefined); }
function choose(schema: Schema, value: unknown): Schema {
  return schema.anyOf?.find(choice => choice.properties?.type?.const === (value as Record<string, unknown>)?.type) || schema.anyOf?.[0] || schema;
}
function initial(schemaInput: Schema): unknown {
  const schema = resolve(schemaInput);
  if (schema.const !== undefined) return schema.const;
  if (schema.anyOf) return initial(schema.anyOf[0]);
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties || {}).filter(([, child]) => child.const !== undefined).map(([key, child]) => [key, child.const]));
  if (schema.type === "array") return [];
  return "";
}
const hidden = ["currentStep", "people", "shareCapitalMinor", "ownershipPercentage"];
export default function DraftFields({ schema: input, value, onChange, path = "", errors, disabled, applicationId, documents, setDocuments, catalogue, onUploadChange, configuration = false, optionsMap = {} }: { schema: Schema; value: unknown; onChange: (value: unknown) => void; path?: string; errors: Record<string, string>; disabled: boolean; applicationId: string; documents: StoredDocumentResponse[]; setDocuments: (value: StoredDocumentResponse[]) => void; catalogue?: ClientCatalogResponse; onUploadChange?: (change: number) => void; configuration?: boolean; optionsMap?: Record<string, { value: string; label: string }[]> }) {
  const [uploading, setUploading] = useState(false); const [uploadError, setUploadError] = useState("");
  let schema = resolve(input); const options = choices(schema); const alternatives = schema.anyOf;
  if (alternatives && !options) schema = choose(schema, value);
  const key = path.split(".").pop() || ""; const fieldLabel = /^\d+$/.test(key) ? `Entry ${Number(key) + 1}` : label(key); const error = errors[path];
  const props = { errors, disabled, applicationId, documents, setDocuments, catalogue, onUploadChange, configuration, optionsMap };
  async function upload(files: FileList | null) {
    if (!files?.length || uploading) return;
    setUploading(true); onUploadChange?.(1); setUploadError("");
    const selected = Array.from(files); const ids = schema.type === "array" && Array.isArray(value) ? [...value] : []; const uploaded = [...documents];
    try {
      for (const file of selected) {
        if (file.size > 20000000 || !["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"].includes(file.type) || (key === "representation" && !file.type.startsWith("image/"))) throw new Error("Choose an image or PDF up to 20 MB. Logo representations must be images.");
        const form = new FormData(); form.set("file", file); form.set("category", key.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase()); form.set("applicationId", applicationId);
        const result = await api<UploadedDocumentResponse>("documents/upload", { method: "POST", body: form });
        uploaded.push(result.data); ids.push(result.data._id); setDocuments([...uploaded]); onChange(schema.type === "array" ? [...ids] : result.data._id);
      }
    } catch (error) { setUploadError(error instanceof ApiError || error instanceof Error ? error.message : "Upload failed."); }
    finally { setUploading(false); onUploadChange?.(-1); }
  }
  const selection = optionsMap[path] || optionsMap[key];
  if (selection) return <fieldset className="space-y-2"><legend className="text-sm font-semibold">{fieldLabel.replace(/ Ids?$/, "")}</legend>{schema.type === "array" ? <div className="grid max-h-56 gap-2 overflow-auto sm:grid-cols-2">{selection.map(option => <label key={option.value} className="flex gap-2 text-sm"><input type="checkbox" disabled={disabled} checked={Array.isArray(value) && value.includes(option.value)} onChange={event => onChange(event.target.checked ? [...(Array.isArray(value) ? value : []), option.value] : (Array.isArray(value) ? value : []).filter(item => item !== option.value))} />{option.label}</label>)}</div> : <select className={inputClass} value={String(value ?? "")} disabled={disabled} onChange={event => onChange(event.target.value || undefined)}><option value="">Choose an option</option>{selection.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}{!selection.length && <p className="text-xs text-slate-500">No options available.</p>}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</fieldset>;
  if (alternatives && !options && alternatives.every(choice => choice.type !== "object")) {
    const selectedType = alternatives.find(choice => choice.type === typeof value) || alternatives[0];
    return <fieldset className="space-y-2 rounded-lg border border-slate-200 p-3"><legend className="text-sm font-semibold">{fieldLabel}</legend><select aria-label={`${fieldLabel} value type`} className={inputClass} disabled={disabled} value={selectedType.type} onChange={event => onChange(event.target.value === "boolean" ? false : event.target.value === "number" ? 0 : "")}>
      {alternatives.map(choice => <option key={choice.type} value={choice.type}>{choice.type === "boolean" ? "Yes / no" : choice.type === "number" ? "Number" : "Text"}</option>)}
    </select><DraftFields {...props} schema={selectedType} value={value} onChange={onChange} path={path} /></fieldset>;
  }
  const docField = !configuration && (key === "representation" || (schema.type === "array" && /Documents$|^documents$|^existingLicences$/.test(key)));
  if (docField) return <div className="space-y-2 rounded-lg border border-slate-200 p-4"><p className="font-semibold">{fieldLabel}</p><input aria-label={`Upload ${fieldLabel.toLowerCase()}`} type="file" accept={key === "representation" ? "image/jpeg,image/png,image/webp,image/svg+xml" : "image/jpeg,image/png,image/webp,image/svg+xml,application/pdf"} multiple={schema.type === "array"} disabled={disabled || uploading} onChange={event => { void upload(event.target.files); event.target.value = ""; }} className="block w-full text-sm" /><p className="text-xs text-slate-500">{uploading ? "Uploading…" : "Images and PDF, up to 20 MB per file."}</p>{documents.filter(doc => key !== "representation" || doc.resourceType === "image").map(doc => <label key={doc._id} className="flex items-center gap-2 text-sm"><input type={schema.type === "array" ? "checkbox" : "radio"} checked={Array.isArray(value) ? value.includes(doc._id) : value === doc._id} name={path} disabled={disabled || uploading} onChange={event => onChange(schema.type === "array" ? event.target.checked ? [...(Array.isArray(value) ? value : []), doc._id] : (Array.isArray(value) ? value : []).filter(id => id !== doc._id) : doc._id)} />{doc.originalFileName}</label>)}{(error || uploadError) && <p role="alert" className="text-xs text-red-700">{uploadError || error}</p>}</div>;
  if (schema.type === "object") {
    const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
    return <fieldset className={path ? "space-y-4 rounded-xl border border-slate-200 p-4" : "space-y-5"}>{path && <legend className="px-2 font-bold">{fieldLabel}</legend>}{alternatives && <label className="block text-sm">Type<select disabled={disabled} value={String(record.type || alternatives[0]?.properties?.type?.const || "")} onChange={event => onChange({ type: event.target.value })} className={inputClass}>{alternatives.map(choice => <option key={String(choice.properties?.type?.const)} value={String(choice.properties?.type?.const)}>{label(String(choice.properties?.type?.const))}</option>)}</select></label>}{Object.entries(schema.properties || {}).filter(([name, child]) => (configuration || !hidden.includes(name)) && child.const === undefined && !(key === "" && name === "documents" && schema.properties?.otherDocuments)).map(([name, child]) => {
      const field = path ? `${path}.${name}` : name;
      return <DraftFields key={field} {...props} schema={child} value={record[name]} onChange={next => { const updated = { ...record }; if (next === undefined || next === "") delete updated[name]; else updated[name] = next; onChange(updated); }} path={field} />;
    })}{error && <p role="alert" className="text-xs text-red-700">{error}</p>}</fieldset>;
  }
  if (!configuration && schema.type === "array" && ["niceClasses", "selectedAddOnIds"].includes(key)) {
    const entries = key === "niceClasses" ? catalogue?.niceClasses.map(item => ({ id: item.number, name: `${item.number}. ${item.name}` })) : catalogue?.addOns.map(item => ({ id: item._id, name: item.name }));
    return <fieldset className="rounded-lg border border-slate-200 p-4"><legend className="px-2 font-semibold">{fieldLabel}</legend><div className="grid max-h-64 gap-3 overflow-auto sm:grid-cols-2">{entries?.map(item => <label key={item.id} className="flex gap-2 text-sm"><input type="checkbox" disabled={disabled} checked={Array.isArray(value) && value.includes(item.id)} onChange={event => onChange(event.target.checked ? [...(Array.isArray(value) ? value : []), item.id] : (Array.isArray(value) ? value : []).filter(id => id !== item.id))} />{item.name}</label>)}{!entries?.length && <p className="text-sm text-slate-500">No options available.</p>}</div>{error && <p className="mt-2 text-xs text-red-700">{error}</p>}</fieldset>;
  }
  if (schema.type === "array" && schema.items && (resolve(schema.items).type === "object" || resolve(schema.items).anyOf?.some(choice => choice.type === "object"))) {
    const items = Array.isArray(value) ? value : [];
    return <fieldset className="space-y-3 rounded-xl border border-slate-200 p-4"><legend className="px-2 font-bold">{fieldLabel}</legend>{items.map((item, index) => <div key={index} className="space-y-2 rounded-lg bg-slate-50 p-3"><DraftFields {...props} schema={schema.items!} value={item} path={`${path}.${index}`} onChange={next => onChange(items.map((current, i) => i === index ? next : current))} /><button type="button" disabled={disabled} onClick={() => onChange(items.filter((_, i) => i !== index))} className="text-sm text-red-700 underline">Remove {fieldLabel.toLowerCase().replace(/s$/, "")} {index + 1}</button></div>)}<button type="button" disabled={disabled || items.length >= (schema.maxItems || 50)} onClick={() => onChange([...items, initial(schema.items!)])} className="text-sm font-semibold text-[#067939]">＋ Add {fieldLabel.toLowerCase().replace(/s$/, "")}</button>{error && <p className="text-xs text-red-700">{error}</p>}</fieldset>;
  }
  if (schema.type === "boolean") return <label className="flex gap-2 text-sm"><input type="checkbox" checked={!!value} disabled={disabled} onChange={event => onChange(event.target.checked)} />{fieldLabel}</label>;
  return <label className="block text-sm font-semibold">{fieldLabel}{options ? <select value={value === undefined ? "" : String(value)} disabled={disabled} onChange={event => onChange(event.target.value || undefined)} className={inputClass}><option value="">Choose an option</option>{options.map(option => <option key={String(option)} value={String(option)}>{label(String(option))}</option>)}</select> : schema.type === "array" ? <input value={Array.isArray(value) ? value.join(", ") : ""} disabled={disabled} onChange={event => onChange(event.target.value ? event.target.value.split(",").map(item => resolve(schema.items!).type === "integer" ? Number(item.trim()) : item.trim()) : undefined)} placeholder="Separate values with commas" className={inputClass} /> : <input type={schema.type === "integer" || schema.type === "number" ? "number" : schema.format === "email" ? "email" : schema.format === "uri" ? "url" : "text"} min={schema.minimum} max={schema.maximum} step={schema.type === "integer" ? 1 : "any"} maxLength={schema.maxLength} placeholder={schema.pattern === "^[A-Z]{2}$" ? "e.g. NG" : schema.pattern === "^[A-Z]{3}$" ? "e.g. USD" : undefined} value={typeof value === "string" || typeof value === "number" ? value : ""} disabled={disabled} onChange={event => onChange(event.target.value === "" ? undefined : schema.type === "integer" || schema.type === "number" ? Number(event.target.value) : event.target.value)} aria-invalid={!!error} aria-describedby={error ? `field-${path}` : undefined} className={inputClass} />}{error && <span role="alert" id={`field-${path}`} className="mt-1 block text-xs font-normal text-red-700">{error}</span>}</label>;
}
