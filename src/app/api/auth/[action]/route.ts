import { NextRequest, NextResponse } from "next/server";
import { backend, session, writeTokens, clearTokens, type Session } from "@/lib/auth/server";
import { validateAuth, type AuthAction, type Fields } from "@/lib/auth/validation";

const paths: Record<AuthAction, string> = { signup: "/auth/signup/user", login: "/auth/login", verify: "/auth/verify", "resend-verification": "/auth/resend-verification", "forgot-password": "/auth/forgot-password", "reset-password": "/auth/reset-password", "change-password": "/users/change-password" };
const fields: Record<AuthAction, string[]> = { signup: ["name", "email", "phone", "password"], login: ["email", "password"], verify: ["token", "otp"], "resend-verification": ["email"], "forgot-password": ["email"], "reset-password": ["token", "otp", "newPassword"], "change-password": ["oldPassword", "newPassword"] };
function json(body: unknown, status = 200) { return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } }); }
function unavailable() { return json({ success: false, message: "The authentication service is unavailable. Please try again shortly." }, 503); }
export async function GET(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  if ((await context.params).action !== "session") return json({ success: false, message: "Not found." }, 404);
  try {
    const current = await session(request);
    const admin = current.user?.role === "admin";
    const response = json({ success: admin, ...(admin ? { data: current.user } : { message: current.user ? "Admin access is required." : current.status >= 500 ? "Authentication is temporarily unavailable." : "Please log in to continue." }) }, admin ? 200 : current.user ? 403 : current.status);
    if (current.tokens) writeTokens(response, current.tokens);
    if (current.retryAfter) response.headers.set("Retry-After", current.retryAfter);
    if ([401, 403].includes(current.status) || (current.user && !admin)) clearTokens(response);
    return response;
  } catch { return unavailable(); }
}
export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  // Cookie credentials may only be used by the same origin.
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) return json({ success: false, message: "Invalid request origin." }, 403);
  const action = (await context.params).action;
  let current: Session | undefined;
  try {
    if (action === "logout" || action === "refresh" || action === "change-password") {
      current = await session(request, action === "refresh");
      if (action === "logout") {
        if (current.status >= 500 || current.status === 429) {
          const response = json({ success: false, message: "Unable to sign out right now. Please try again shortly." }, current.status);
          if (current.tokens) writeTokens(response, current.tokens);
          if (current.retryAfter) response.headers.set("Retry-After", current.retryAfter);
          return response;
        }
        if (current.accessToken && current.user) {
          const result = await backend("/auth/logout", "POST", undefined, current.accessToken);
          if (result.status >= 400 && ![401, 403].includes(result.status)) {
            const response = json(result.data, result.status);
            if (result.retryAfter) response.headers.set("Retry-After", result.retryAfter);
            if (current.tokens) writeTokens(response, current.tokens);
            return response;
          }
        }
        const response = json({ success: true, message: "You have been signed out." });
        clearTokens(response);
        return response;
      }
      if (!current.user) {
        const response = json({ success: false, message: current.status >= 500 ? "Authentication is temporarily unavailable." : "Your session expired. Please log in again." }, current.status);
        if (current.tokens) writeTokens(response, current.tokens);
        if (current.retryAfter) response.headers.set("Retry-After", current.retryAfter);
        if ([401, 403].includes(current.status)) clearTokens(response);
        return response;
      }
      if (current.user.role !== "admin") return json({ success: false, message: "Admin access is required." }, 403);
      if (action === "refresh") { const response = json({ success: true, data: current.user }); if (current.tokens) writeTokens(response, current.tokens); return response; }
      const body = await request.json().catch(() => null);
      const errors = validateAuth("change-password", body && typeof body === "object" ? Object.fromEntries(Object.entries(body).filter(([, value]) => typeof value === "string")) as Fields : {});
      if (Object.keys(errors).length) {
        const response = json({ success: false, message: "Please correct the highlighted fields.", errors }, 422);
        if (current.tokens) writeTokens(response, current.tokens);
        return response;
      }
      const result = await backend(paths["change-password"], "POST", { oldPassword: body.oldPassword, newPassword: body.newPassword }, current.accessToken);
      const response = json(result.data, result.status);
      if (result.retryAfter) response.headers.set("Retry-After", result.retryAfter);
      if (result.data.success || result.status === 401) clearTokens(response); else if (current.tokens) writeTokens(response, current.tokens);
      return response;
    }
    if (!Object.hasOwn(paths, action)) return json({ success: false, message: "Not found." }, 404);
    if (action === "signup") return json({ success: false, message: "Admin accounts cannot be created here." }, 403);
    const name = action as AuthAction;
    const raw = await request.json().catch(() => null);
    const body: Fields = {};
    for (const key of fields[name]) if (typeof raw?.[key] === "string") body[key] = ["email", "name", "phone", "token", "otp"].includes(key) ? raw[key].trim() : raw[key];
    const errors = validateAuth(name, body);
    if (Object.keys(errors).length) return json({ success: false, message: "Please correct the highlighted fields.", errors }, 422);
    const result = await backend(paths[name], "POST", body);
    if (name === "login" && result.data.success && (!result.data.data?.user || !result.data.data?.accessToken || !result.data.data?.refreshToken)) return json({ success: false, message: "The authentication service returned an incomplete session. Please try again." }, 502);
    if (name === "login" && result.data.success && result.data.data.user.role !== "admin") return json({ success: false, message: "Admin access is required." }, 403);
    const payload = name === "login" && result.data.success ? { ...result.data, data: result.data.data?.user } : result.data;
    const response = json(payload, result.status);
    if (result.retryAfter) response.headers.set("Retry-After", result.retryAfter);
    if (name === "login" && result.data.success && result.data.data?.accessToken && result.data.data?.refreshToken) writeTokens(response, result.data.data);
    if (name === "reset-password" && result.data.success) clearTokens(response);
    return response;
  } catch {
    const response = unavailable();
    if (current?.tokens) writeTokens(response, current.tokens);
    return response;
  }
}
