import { NextResponse, type NextRequest } from "next/server";

export type AuthUser = { _id: string; name: string; email: string; phone?: string; role: string; isEmailVerified: boolean; isPhoneVerified?: boolean; accountStatus: string };
export type Tokens = { accessToken: string; refreshToken: string };
export type Session = { status: number; user: AuthUser | null; accessToken?: string; tokens?: Tokens; retryAfter?: string | null };
function validTokens(value: unknown): value is Tokens {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Tokens>;
  return typeof candidate.accessToken === "string" && !!candidate.accessToken && typeof candidate.refreshToken === "string" && !!candidate.refreshToken;
}
function validUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthUser>;
  return typeof candidate._id === "string" && typeof candidate.name === "string" && typeof candidate.email === "string" && ["user", "admin"].includes(candidate.role || "") && typeof candidate.isEmailVerified === "boolean" && typeof candidate.accountStatus === "string";
}
export const ACCESS_COOKIE = "registat_access";
export const REFRESH_COOKIE = "registat_refresh";
const baseUrl = () => {
  const value = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!value) throw new Error("API_URL is not configured.");
  return value.replace(/\/$/, "");
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
}
export function clearTokens(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
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
    const user = profile.status === 200 && validUser(profile.data?.data) ? profile.data.data : null;
    return { status: profile.status === 200 && !user ? 502 : profile.status, user, accessToken, tokens, retryAfter: profile.retryAfter };
  } catch {
    // A profile outage after rotation must not discard the newly issued credentials.
    return { status: 503, user: null, accessToken, tokens };
  }
}
