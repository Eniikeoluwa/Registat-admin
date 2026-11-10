import type { Schema } from "@/lib/api/validation";
export const companyEntities = ["Private Limited Company", "Public Limited Company", "Sole Proprietorship", "Partnership", "Non-Profit Organisation", "Limited Liability Partnership", "Company Limited by Guarantee"];
export function selectCompanyFields(schema: Schema, fields: string[]): Schema {
  return { type:"object", properties:Object.fromEntries(Object.entries(schema.properties || {}).filter(([key])=>fields.includes(key))), required:(schema.required || []).filter(key=>fields.includes(key)), additionalProperties:false };
}
/** Parse decimal major units without floating-point rounding or unsafe integer payloads. */
export function companyMinorUnits(value: string): number {
  if(!/^\d+(?:\.\d{1,2})?$/.test(value)) throw new Error("Enter a non-negative amount with at most two decimal places.");
  const [whole,fraction=""] = value.split("."); const minor=BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,"0"));
  if(minor>BigInt(Number.MAX_SAFE_INTEGER)) throw new Error("This amount exceeds the supported limit.");
  return Number(minor);
}
