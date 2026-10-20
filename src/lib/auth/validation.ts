export type AuthAction = "signup" | "login" | "verify" | "resend-verification" | "forgot-password" | "reset-password" | "change-password";
export type Fields = Record<string, string>;
export const emailValid = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export const tokenValid = (value: string) => /^[a-f0-9]{64}$/.test(value);
export function validateAuth(action: AuthAction, values: Fields): Fields {
  const errors: Fields = {};
  if (["signup", "login", "resend-verification", "forgot-password"].includes(action) && !emailValid(values.email || "")) errors.email = "Enter a valid email address.";
  if (action === "signup") {
    if (!values.name || values.name.trim().length < 2 || values.name.trim().length > 100) errors.name = "Enter your full name (2–100 characters).";
    if (!/^\+?[0-9]{7,15}$/.test(values.phone || "")) errors.phone = "Enter a phone number with 7–15 digits and an optional + prefix.";
  }
  if (action === "signup" || action === "login") {
    const minimum = action === "signup" ? 8 : 1;
    if (!values.password || values.password.length < minimum || values.password.length > 128) errors.password = `Password must contain ${minimum}–128 characters.`;
  }
  if (action === "reset-password" || action === "change-password") {
    if (!values.newPassword || values.newPassword.length < 8 || values.newPassword.length > 128) errors.newPassword = "Use 8–128 characters for your new password.";
    if (values.confirmPassword !== undefined && values.confirmPassword !== values.newPassword) errors.confirmPassword = "Passwords do not match.";
  }
  if (action === "change-password") {
    if (!values.oldPassword || values.oldPassword.length > 128) errors.oldPassword = "Enter your current password (up to 128 characters).";
    if (values.newPassword === values.oldPassword) errors.newPassword = "Choose a different password from your current password.";
  }
  if (action === "verify" || action === "reset-password") {
    if (!tokenValid(values.token || "")) errors.token = "Open the complete link from your email. If it contains no verification token, contact support.";
    if (!/^[0-9]{6}$/.test(values.otp || "")) errors.otp = "Enter the six-digit code from your email.";
  }
  return errors;
}
export function safeReturnTo(value: string | null | undefined, role?: string) {
  if (role !== "admin" || !value || !/^\/admin(?:[/?#]|$)/.test(value) || /[\\\r\n]/.test(value)) return "/admin/dashboard";
  return value;
}

export function authHref(path: string, returnTo?: string | null, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params);
  // Preserve admin destinations until login identifies the user's actual role.
  if (returnTo) query.set("next", safeReturnTo(returnTo, "admin"));
  return query.size ? `${path}?${query.toString()}` : path;
}
