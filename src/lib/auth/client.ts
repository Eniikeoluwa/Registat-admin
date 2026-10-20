export type AuthUser = { _id: string; name: string; email: string; phone?: string; role: string; isEmailVerified: boolean; isPhoneVerified?: boolean; accountStatus: string };
export class AuthError extends Error {
  constructor(message: string, public status: number, public errors: Record<string, string> = {}) { super(message); }
}
export async function authRequest<T = AuthUser>(action: string, body?: Record<string, string>, method = "POST"): Promise<{ success: boolean; message: string; data: T }> {
  let response: Response;
  try { response = await fetch(`/api/auth/${action}`, { method, credentials: "same-origin", cache: "no-store", headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
  catch { throw new AuthError("Unable to connect. Check your connection and try again.", 0); }
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    const errors: Record<string, string> = {};
    if (Array.isArray(result?.errors)) {
      for (const item of result.errors) if (typeof item?.field === "string" && typeof item?.message === "string") errors[item.field.replace(/^\//, "")] = item.message;
    } else if (result?.errors && typeof result.errors === "object") {
      for (const [key, value] of Object.entries(result.errors)) if (typeof value === "string") errors[key] = value;
    }
    const retry = response.headers.get("Retry-After");
    throw new AuthError(response.status === 429 ? `Too many attempts. ${retry ? `Try again in ${retry} seconds.` : "Please try again later."}` : result?.message || "The request could not be completed. Please try again.", response.status, errors);
  }
  return result;
}
export function rememberEmail(email: string) { try { sessionStorage.setItem("registat:signup", JSON.stringify({ email })); } catch { /* Email storage is optional; authentication must still work. */ } }

export function forgetEmail() { try { sessionStorage.removeItem("registat:signup"); } catch { /* Storage may be unavailable in private browser modes. */ } }
