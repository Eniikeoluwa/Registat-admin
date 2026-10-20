"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@/components/auth/AccountIdentity";
import type { PaginationMetaResponse } from "./types";
export type Result<T> = { success: boolean; message: string; data: T; meta?: { pagination: PaginationMetaResponse } };
export class ApiError extends Error {
  constructor(message: string, public status: number, public errors: Record<string, string> = {}) { super(message); }
}
export async function api<T>(path: string, options: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<Result<T>> {
  let response: Response;
  try {
    const multipart = options.body instanceof FormData;
    response = await fetch(`/api/registat/${path}`, { method: options.method || "GET", credentials: "same-origin", cache: "no-store", signal: options.signal, ...(options.body !== undefined ? { headers: multipart ? {} : { "Content-Type": "application/json" }, body: multipart ? options.body as FormData : JSON.stringify(options.body) } : {}) });
  } catch (error) { if (options.signal?.aborted) throw error; throw new ApiError("Unable to connect. Please check your connection and try again.", 0); }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const errors: Record<string, string> = {};
    if (Array.isArray(result?.errors)) for (const entry of result.errors) { if (typeof entry?.field === "string" && typeof entry?.message === "string") errors[entry.field.replace(/^\//, "").replaceAll("/", ".")] = entry.message; }
    else if (result?.errors && typeof result.errors === "object") for (const [key, value] of Object.entries(result.errors)) if (typeof value === "string") errors[key] = value;
    if (response.status === 401 && typeof window !== "undefined") window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
    throw new ApiError(response.status === 429 ? `Too many requests. ${response.headers.get("Retry-After") ? `Try again in ${response.headers.get("Retry-After")} seconds.` : "Please try again later."}` : result?.message || "Unable to complete this request.", response.status, errors);
  }
  return result;
}
export function useApi<T>(path: string | null) {
  const account = useAccount(); const [revision, setRevision] = useState(0);
  const key = `${account?._id}:${path}:${revision}`;
  const [state, setState] = useState<{ key: string; result?: Result<T>; error?: string }>({ key: "" });
  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal }).then(result => { if (!controller.signal.aborted) setState({ key, result }); }).catch(error => { if (!controller.signal.aborted) setState({ key, error: error instanceof Error ? error.message : "Unable to load data." }); });
    return () => controller.abort();
  }, [path, key]);
  return { data: state.key === key ? state.result?.data : undefined, pagination: state.key === key ? state.result?.meta?.pagination : undefined, error: state.key === key ? state.error : undefined, loading: !!path && (state.key !== key || (!state.result && !state.error)), reload: () => setRevision(value => value + 1) };
}
