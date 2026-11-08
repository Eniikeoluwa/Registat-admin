"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthReturnTo } from "./useAuthReturnTo";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { authRequest, AuthError, rememberChallenge, readChallenge, clearChallenge, type Challenge } from "@/lib/auth/client";
import { validateAuth, tokenValid, authHref } from "@/lib/auth/validation";
const subscribe = () => () => {};
export default function PasswordRecoveryForm({ reset = false }: { reset?: boolean }) {
  const router = useRouter();
  const returnTo = useAuthReturnTo();
  const token = useSyncExternalStore(subscribe, () => readChallenge("reset")?.token || "", () => "");
  const [values, setValues] = useState<Record<string, string>>({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || done) return;
    const action = reset ? "reset-password" : "forgot-password";
    const body: Record<string, string> = reset ? { email: readChallenge("reset")?.email || values.email.trim(), token, code: values.otp, password: values.newPassword, confirmPassword: values.confirmPassword } : { email: values.email.trim() };
    const problems = validateAuth(action, body);
    setErrors(problems); setError(""); setNotice("");
    if (Object.keys(problems).length) return;
    setBusy(true);
    try {
      const result = await authRequest<Challenge>(action, body);
      if (!reset) { rememberChallenge(result.data, "reset"); router.push(authHref("/reset-password", returnTo)); } else clearChallenge("reset");
      setNotice(reset ? "Your password was reset. Log in with your new password." : result.message || "If an account exists for this email, a reset code has been requested.");
      setDone(true);
      setValues({ email: values.email, otp: "", newPassword: "", confirmPassword: "" });
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to complete your request."); if (error instanceof AuthError) setErrors({ ...error.errors, ...(error.errors.code ? { otp: error.errors.code } : {}), ...(error.errors.password ? { newPassword: error.errors.password } : {}) }); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} noValidate className="mt-8 space-y-5">
    <h1 className="text-3xl font-extrabold">{reset ? "Reset your password" : "Forgot your password?"}</h1>
    <p className="text-sm text-slate-600">{reset ? "Enter the code from your email and choose a new password." : "Enter your account email to request a password reset."}</p>
    {reset && !tokenValid(token) && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><Link href={authHref("/forgot-password", returnTo)} className="underline">Request a new reset code</Link> to continue in this browser.</p>}
    {(reset ? [["otp", "Verification code", "text", "one-time-code"], ["newPassword", "New password", "password", "new-password"], ["confirmPassword", "Confirm new password", "password", "new-password"]] : [["email", "Email address", "email", "email"]]).map(([key, label, type, autoComplete]) => <label key={key} className="block text-sm font-semibold">{label}<input name={key} type={type} autoComplete={autoComplete} inputMode={key === "otp" ? "numeric" : undefined} maxLength={key === "otp" ? 6 : key === "email" ? 254 : 128} value={values[key]} disabled={done} onChange={event => setValues({ ...values, [key]: key === "otp" ? event.target.value.replace(/\D/g, "") : event.target.value })} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} className="mt-2 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 outline-[#067939]" />{errors[key] && <span id={`${key}-error`} className="mt-1 block text-xs text-red-600">{errors[key]}</span>}</label>)}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
    {!done && <button type="submit" disabled={busy || (reset && !tokenValid(token))} className="w-full rounded-lg bg-[#067939] px-6 py-3 font-semibold text-white disabled:opacity-50">{busy ? "Please wait…" : reset ? "Reset password" : "Send reset instructions"}</button>}
    {done && !reset && <p className="text-sm text-slate-600">Enter the code from your email on the reset password screen.</p>}
    <Link href={authHref("/login", returnTo)} className="block text-center text-sm font-semibold text-[#067939]">Back to login</Link>
  </form>;
}
