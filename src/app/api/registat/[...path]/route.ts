import { NextRequest, NextResponse } from "next/server";
import { backend, clearTokens, session, writeTokens, type Session } from "@/lib/auth/server";
import { isStaff, can } from "@/lib/auth/permissions";
import { matchContract, resolve, validate, type Schema } from "@/lib/api/validation";
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
    if (!contract.public && !isStaff(current?.user)) return finish({ success: false, message: "Admin access is required." }, 403);
    if (contract.admin && !isStaff(current?.user)) return finish({ success: false, message: "Admin access is required." }, 403);
    if (contract.roles.length && !(contract.roles as string[]).includes(current?.user?.role || "")) return finish({ success: false, message: "Your staff role cannot perform this action." }, 403);
    if (contract.permissions.some(permission => !can(current?.user, permission) && !(path === "catalog/admin/currency-settings" && can(current?.user, "currency-rates:write")))) return finish({ success: false, message: "You do not have permission to perform this action." }, 403);
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const errors = validate(contract.query as Schema, query);
    for (const key of request.nextUrl.searchParams.keys()) if (request.nextUrl.searchParams.getAll(key).length > 1) errors[key] = "Use only one value for this filter.";
    if (query.submittedAfter && query.submittedBefore && Date.parse(query.submittedAfter) > Date.parse(query.submittedBefore)) errors.submittedBefore = "End date must follow the start date.";
    if (Object.keys(errors).length) return finish({ success: false, message: "Please correct the highlighted fields.", errors }, 422);
    if (query.registeredAfter && query.registeredBefore && Date.parse(query.registeredAfter) > Date.parse(query.registeredBefore)) errors.registeredBefore = "End date must follow the start date.";
    if (Object.keys(errors).length) return finish({ success: false, message: "Please correct the highlighted fields.", errors }, 422);
    if (query.joinedAfter && query.joinedBefore && Date.parse(query.joinedAfter) > Date.parse(query.joinedBefore)) return finish({ success: false, message: "End date must follow the start date.", errors: { joinedBefore: "End date must follow the start date." } }, 422);
    let body: unknown;
    if (contract.multipart) {
      const form = await request.formData(); const file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > 20000000 || !["image/jpeg", "image/png", "image/webp", "image/svg+xml", "application/pdf"].includes(file.type)) return finish({ success: false, message: "Choose an image or PDF up to 20 MB." }, 422);
      const metadata: Record<string, unknown> = {};
      for (const [key, value] of form.entries()) {
        if (form.getAll(key).length > 1) return finish({ success: false, message: "Use one value per upload field." }, 422);
        if (key !== "file") metadata[key] = value;
      }
      const uploadSchema = { ...contract.multipart } as Schema;
      // Validate file separately; all text metadata uses the documented multipart schema.
      const resolved = uploadSchema.$ref ? resolve(uploadSchema) : uploadSchema;
      const problems = validate({ ...resolved, properties: Object.fromEntries(Object.entries(resolved.properties || {}).filter(([key]) => key !== "file")), required: resolved.required?.filter(key => key !== "file") }, metadata);
      if (Object.keys(problems).length) return finish({ success: false, message: "Please correct the upload details.", errors: problems }, 422);
      body = form;
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
    if (result.status >= 200 && result.status < 300 && path === "users/change-password") clearTokens(response);
    return response;
  } catch { return finish({ success: false, message: "The service is unavailable. Please try again shortly." }, 503); }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
export const PUT = handle;
