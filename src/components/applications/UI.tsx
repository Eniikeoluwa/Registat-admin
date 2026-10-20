"use client";
import Link from "next/link";
import { label } from "@/lib/api/validation";
export const inputClass = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-[#067939] disabled:opacity-50";
export const buttonClass = "inline-flex items-center justify-center rounded-lg bg-[#067939] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
export const panelClass = "rounded-xl border border-slate-200 bg-white p-5";
export const statuses = ["in_progress", "pending", "under_review", "action_required", "processing", "completed", "rejected", "cancelled"];
export const workflows = ["company_registration", "trademark_registration", "business_licensing", "bank_account_opening"];
export function Status({ value, display }: { value: string; display?: string }) { return <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${value === "completed" || value === "paid" ? "bg-green-50 text-green-800" : ["rejected", "cancelled", "action_required"].includes(value) ? "bg-red-50 text-red-800" : "bg-slate-100 text-slate-700"}`}>{display || label(value)}</span>; }
export function LoadState({ loading, error, retry }: { loading: boolean; error?: string; retry: () => void }) { return loading ? <p role="status" className="p-6 text-slate-600">Loading…</p> : error ? <div role="alert" className="rounded-lg bg-red-50 p-5 text-sm text-red-700">{error}<button type="button" onClick={retry} className="ml-4 underline">Try again</button></div> : null; }
export function Empty({ title, description }: { title: string; description: string }) { return <div className={`${panelClass} py-12 text-center`}><h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{description}</p></div>; }
export function ApplicationLink({ id, admin = false, children }: { id: string; admin?: boolean; children: React.ReactNode }) { return <Link href={`${admin ? "/admin" : ""}/applications/${id}`} className="font-semibold text-[#067939] hover:underline">{children}</Link>; }
export function date(value?: string) { return value && Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "Europe/Vilnius" }).format(new Date(value)) : "Not submitted"; }
