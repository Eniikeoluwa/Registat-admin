import contracts from "./contracts.json";
export type Schema = { $ref?: string; type?: string; const?: unknown; enum?: unknown[]; anyOf?: Schema[]; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: boolean; minProperties?: number; items?: Schema; minItems?: number; maxItems?: number; uniqueItems?: boolean; minLength?: number; maxLength?: number; minimum?: number; maximum?: number; pattern?: string; format?: string };
export const schemas = contracts.schemas as unknown as Record<string, Schema>;
export const resolve = (schema: Schema): Schema => schema.$ref ? schemas[schema.$ref.split("/").pop()!] : schema;
export const label = (key: string) => key.replace(/Minor$/, " (smallest currency unit)").replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ").replace(/^./, c => c.toUpperCase());
export function validate(schemaInput: Schema, value: unknown, path = ""): Record<string, string> {
  const schema = resolve(schemaInput); const errors: Record<string, string> = {};
  const fail = (message: string) => { errors[path || "form"] = message; };
  if (schema.anyOf) {
    const choices = schema.anyOf.map(choice => validate(choice, value, path));
    return choices.find(result => !Object.keys(result).length) || choices.sort((a, b) => Object.keys(a).length - Object.keys(b).length)[0];
  }
  if (schema.const !== undefined && value !== schema.const) fail(`Choose ${label(String(schema.const))}.`);
  if (schema.enum && !schema.enum.includes(value)) fail("Choose one of the available options.");
  if (schema.type === "object") {
    if (!value || typeof value !== "object" || Array.isArray(value)) { fail("Enter the required details."); return errors; }
    const object = value as Record<string, unknown>;
    if (schema.minProperties && Object.keys(object).length < schema.minProperties) fail("Enter at least one field to save.");
    for (const required of schema.required || []) if (object[required] === undefined || object[required] === "") errors[path ? `${path}.${required}` : required] = `${label(required)} is required.`;
    for (const [key, item] of Object.entries(object)) {
      const field = path ? `${path}.${key}` : key;
      if (schema.properties?.[key]) Object.assign(errors, validate(schema.properties[key], item, field));
      else if (schema.additionalProperties === false) errors[field] = "This field is not supported.";
    }
  }
  if (schema.type === "string") {
    if (typeof value !== "string") { fail("Enter text."); return errors; }
    if (schema.minLength !== undefined && value.trim().length < schema.minLength) fail(`Use at least ${schema.minLength} characters.`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) fail(`Use no more than ${schema.maxLength} characters.`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail("Enter a value in the required format.");
    if (schema.format === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) fail("Enter a valid email address.");
    if (schema.format === "capitalized-mark-name" && !/^\p{Lu}/u.test(value)) fail("Start the mark name with an uppercase letter.");
    if (schema.format === "date-time" && (!/^\d{4}-\d{2}-\d{2}T/.test(value) || !Number.isFinite(Date.parse(value)))) fail("Enter a valid date and time.");
    if (schema.format === "uri") { try { const url = new URL(value); if (!["http:", "https:"].includes(url.protocol)) fail("Enter an http or https website URL."); } catch { fail("Enter a valid website URL."); } }
  }
  if (schema.type === "integer" || schema.type === "number") {
    if (typeof value !== "number" || !Number.isFinite(value) || (schema.type === "integer" && !Number.isSafeInteger(value))) fail("Enter a valid number.");
    else if ((schema.minimum !== undefined && value < schema.minimum) || (schema.maximum !== undefined && value > schema.maximum)) fail(`Enter a number between ${schema.minimum ?? 0} and ${schema.maximum ?? "the allowed maximum"}.`);
  }
  if (schema.type === "boolean" && typeof value !== "boolean") fail("Choose yes or no.");
  if (schema.type === "array") {
    if (!Array.isArray(value)) { fail("Choose one or more values."); return errors; }
    if ((schema.minItems !== undefined && value.length < schema.minItems) || (schema.maxItems !== undefined && value.length > schema.maxItems)) fail(`Choose ${schema.minItems ?? 0}–${schema.maxItems ?? "the allowed number of"} items.`);
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) fail("Remove duplicate values.");
    if (schema.items) value.forEach((item, index) => Object.assign(errors, validate(schema.items!, item, `${path}.${index}`)));
  }
  return errors;
}
export function matchContract(path: string, method: string) {
  return contracts.routes.find(route => route.method === method && new RegExp("^" + route.path.replace(/\{id\}/g, "[a-fA-F0-9]{24}").replace(/\{country\}/g, "[A-Z]{2}").replace(/\{reference\}/g, "REGPAY-[a-f0-9]{32}") + "$").test(path));
}
export function draftRules(workflow: string) {
  const keys: Record<string, string> = { company_registration: "CompanyRegistration", trademark_registration: "Trademark", business_licensing: "BusinessLicensing", bank_account_opening: "BankAccount" };
  const key = keys[workflow];
  return { draft: schemas[`${key}Draft`], submission: schemas[`${key}Submission`] };
}

export function validateDraft(workflow: string, values: Record<string, unknown>, submit = false) {
  const rules = draftRules(workflow);
  const errors = validate(rules.draft, values);
  let submission = values;
  if (workflow === "company_registration" && Array.isArray(values.shareholders) && typeof values.totalShares === "number") {
    const total = values.totalShares;
    const allocated = values.shareholders.reduce((sum, item) => sum + Number(item.shares || 0), 0);
    if (allocated > total) errors.shareholders = "Allocated shares cannot exceed total shares.";
    submission = { ...values, shareholders: values.shareholders.map(item => ({ ...item, ownershipPercentage: total ? item.shares / total * 100 : 0 })) };
    if (typeof values.shareValueMinor === "number" && !Number.isSafeInteger(total * values.shareValueMinor)) errors.shareValueMinor = "Total share capital exceeds the allowed maximum.";
  }
  if (submit && rules.submission) Object.assign(errors, validate(rules.submission, submission));
  return errors;
}
