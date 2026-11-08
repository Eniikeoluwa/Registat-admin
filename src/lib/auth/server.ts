import { createHmac, timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { schemas } from "@/lib/api/validation";
import { isStaff } from "./permissions";
import type { AdminPermission } from "@/lib/api/types";
import { NextResponse, type NextRequest } from "next/server";

export type AuthUser = { _id: string; name: string; email: string; phone?: string; role: string; isEmailVerified: boolean; isPhoneVerified?: boolean; accountStatus: string; subAdminRole?: string; permissions?: AdminPermission[] };
export type Tokens = { accessToken: string; refreshToken: string; identity?: AuthUser };
export type Session = { status: number; user: AuthUser | null; accessToken?: string; tokens?: Tokens; retryAfter?: string | null };
function validTokens(value: unknown): value is Tokens {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Tokens>;
  return typeof candidate.accessToken === "string" && !!candidate.accessToken && typeof candidate.refreshToken === "string" && !!candidate.refreshToken;
}
function validUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthUser>;
  return typeof candidate._id === "string" && typeof candidate.name === "string" && typeof candidate.email === "string" && ["user", "superAdmin", "subAdmin"].includes(candidate.role || "") && typeof candidate.isEmailVerified === "boolean" && typeof candidate.accountStatus === "string";
}
export const ACCESS_COOKIE = "registat_access";
export const REFRESH_COOKIE = "registat_refresh";
export const PERMISSIONS_COOKIE = "registat_permissions";
function sign(value: string, key: string) { return createHmac("sha256", key).update(value).digest("base64url"); }
function readPermissions(value: string | undefined, key: string | undefined, user: AuthUser): AdminPermission[] | undefined {
  if (!value || !key) return;
  try {
    const [body, signature] = value.split(".");
    const expected = sign(body, key);
    if (signature?.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return;
    const snapshot = JSON.parse(Buffer.from(body, "base64url").toString());
    if (snapshot.id !== user._id || snapshot.role !== user.role || snapshot.assignment !== user.subAdminRole || !Array.isArray(snapshot.permissions)) return;
    const allowed = schemas.AdminPermission.enum || [];
    if (snapshot.permissions.every((permission: unknown) => allowed.includes(permission))) return snapshot.permissions;
  } catch { /* Invalid snapshots require a fresh staff login. */ }
}
const baseUrl = () => {
  const value = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!value) throw new Error("API_URL is not configured.");
  const url = new URL(value.trim());
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("API_URL must be an HTTP(S) base URL without credentials, query, or fragment.");
  return url.href.replace(/\/+$/, "");
};
export async function backend(path: string, method = "GET", body?: unknown, token?: string) {
  const multipart = typeof FormData !== "undefined" && body instanceof FormData;
  const response = await fetch(`${baseUrl()}${path}`, {
    method, cache: "no-store", signal: AbortSignal.timeout(25000),
    headers: { Accept: "application/json", ...(body && !multipart ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: multipart ? body as FormData : JSON.stringify(body) } : {}),
  });
  const parsed = await response.json().catch(() => null);
  const valid = parsed && typeof parsed === "object" && typeof parsed.success === "boolean" && parsed.success === response.ok;
  const data = valid ? parsed : { success: false, message: "The authentication service returned an invalid response. Please try again." };
  return { status: valid ? response.status : 502, data, retryAfter: response.headers.get("Retry-After") || (response.status === 429 ? response.headers.get("X-RateLimit-Reset") : null) };
}
export function writeTokens(response: NextResponse, tokens: Tokens) {
  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  // Keep the access cookie until the refresh session expires, so an expired access JWT can be rotated.
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...options, maxAge: 60 * 60 * 24 * 30 });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...options, maxAge: 60 * 60 * 24 * 30 });
  if (tokens.identity?.permissions) {
    const user = tokens.identity;
    const body = Buffer.from(JSON.stringify({ id: user._id, role: user.role, assignment: user.subAdminRole, permissions: user.permissions })).toString("base64url");
    response.cookies.set(PERMISSIONS_COOKIE, `${body}.${sign(body, tokens.refreshToken)}`, { ...options, maxAge: 60 * 60 * 24 * 30 });
  }
}
export function clearTokens(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  response.cookies.delete(PERMISSIONS_COOKIE);
}
export async function session(request: NextRequest, forceRefresh = false): Promise<Session> {
  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  let tokens: Tokens | undefined;
  if (!accessToken && !refreshToken) return { status: 401, user: null };
  try {
    let profile = !forceRefresh && accessToken ? await backend("/users/me", "GET", undefined, accessToken) : { status: 401, data: null, retryAfter: null };
    if (profile.status === 401 && refreshToken) {
      const refreshed = await backend("/auth/refresh", "POST", undefined, refreshToken);
      if (refreshed.status !== 200) return { status: refreshed.status, user: null, retryAfter: refreshed.retryAfter };
      if (!validTokens(refreshed.data.data)) return { status: 502, user: null };
      const rotated: Tokens = refreshed.data.data;
      tokens = rotated;
      accessToken = rotated.accessToken;
      profile = await backend("/users/me", "GET", undefined, accessToken);
    }
    let user = profile.status === 200 && validUser(profile.data?.data) ? profile.data.data : null;
    if (user && isStaff(user)) {
      const permissions = readPermissions(request.cookies.get(PERMISSIONS_COOKIE)?.value, refreshToken, user);
      if (!permissions) return { status: 401, user: null };
      user = { ...user, permissions };
      if (tokens) tokens.identity = user;
    }
    return { status: profile.status === 200 && !user ? 502 : profile.status, user, accessToken, tokens, retryAfter: profile.retryAfter };
  } catch {
    // A profile outage after rotation must not discard the newly issued credentials.
    return { status: 503, user: null, accessToken, tokens };
  }
}
