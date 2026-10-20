import { NextRequest, NextResponse } from "next/server";
import { backend, clearTokens, session, writeTokens, type Session } from "@/lib/auth/server";
import { matchContract, validate, type Schema } from "@/lib/api/validation";
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  let current: Session | undefined;
  const finish = (body: unknown, status: number, retryAfter?: string | null) => {
    const response = NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
    if (current?.tokens) writeTokens(response, current.tokens);
    if (status === 401) clearTokens(response);
    if (retryAfter) response.headers.set("Retry-After", retryAfter);
    return response;
  };
  try {
    const path = (await context.params).path.join("/");
    const contract = matchContract(path, request.method);
    if (!contract) return finish({ success: false, message: "Endpoint not found." }, 404);
    if (request.method !== "GET" && (request.headers.get("sec-fetch-site") === "cross-site" || (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin))) return finish({ success: false, message: "Invalid request origin." }, 403);
    if (!contract.public) current = await session(request);
    if (!contract.public && !current?.user) return finish({ success: false, message: (current?.status || 503) >= 500 ? "Service temporarily unavailable. Please try again." : "Please log in to continue." }, current?.status || 503, current?.retryAfter);
    if (!contract.public && current?.user?.role !== "admin") return finish({ success: false, message: "Admin access is required." }, 403);
    if (contract.admin && current?.user?.role !== "admin") return finish({ success: false, message: "Admin access is required." }, 403);
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const errors = validate(contract.query as Schema, query);
    for (const key of request.nextUrl.searchParams.keys()) if (request.nextUrl.searchParams.getAll(key).length > 1) errors[key] = "Use only one value for this filter.";
    if (query.submittedAfter && query.submittedBefore && Date.parse(query.submittedAfter) > Date.parse(query.submittedBefore)) errors.submittedBefore = "End date must follow the start date.";
    if (Object.keys(errors).length) return finish({ success: false, message: "Please correct the highlighted fields.", errors }, 422);
    if (query.registeredAfter && query.registeredBefore && Date.parse(query.registeredAfter) > Date.parse(query.registeredBefore)) errors.registeredBefore = "End date must follow the start date.";
    if (Object.keys(errors).length) return finish({ success: false, message: "Please correct the highlighted fields.", errors }, 422);
    if (query.joinedAfter && query.joinedBefore && Date.parse(query.joinedAfter) > Date.parse(query.joinedBefore)) return finish({ success: false, message: "End date must follow the start date.", errors: { joinedBefore: "End date must follow the start date." } }, 422);
    let body: unknown;
    if (path === "documents/upload") {
      const form = await request.formData(); const file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > 20000000 || !["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"].includes(file.type)) return finish({ success: false, message: "Choose an image or PDF up to 20 MB." }, 422);
      if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(String(form.get("category") || "")) || String(form.get("category")).length > 100 || (form.has("applicationId") && !/^[a-fA-F0-9]{24}$/.test(String(form.get("applicationId"))))) return finish({ success: false, message: "Choose a valid application and document category." }, 422);
      const clean = new FormData(); clean.set("file", file); clean.set("category", String(form.get("category"))); if (form.has("applicationId")) clean.set("applicationId", String(form.get("applicationId"))); body = clean;
    } else if (request.method !== "GET") {
      const text = await request.text();
      if (contract.schema) {
        try { body = JSON.parse(text); } catch { return finish({ success: false, message: "Enter valid details." }, 400); }
        const problems = validate(contract.schema as Schema, body);
        if (Object.keys(problems).length) return finish({ success: false, message: "Please correct the highlighted fields.", errors: problems }, 422);
      } else if (text.trim()) return finish({ success: false, message: "This action does not accept form data." }, 422);
    }
    const result = await backend(`/${path}${request.nextUrl.search}`, request.method, body, current?.accessToken);
    const response = finish(result.data, result.status, result.retryAfter);
    if (result.status >= 200 && result.status < 300 && (path === "users/change-password" || (path === `users/admin/${current?.user?._id}/status` && (body as { status?: string })?.status !== "active"))) clearTokens(response);
    return response;
  } catch { return finish({ success: false, message: "The service is unavailable. Please try again shortly." }, 503); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
