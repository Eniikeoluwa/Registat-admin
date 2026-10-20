"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authRequest, AuthError } from "@/lib/auth/client";
import { validateAuth, authHref } from "@/lib/auth/validation";
export default function ChangePasswordForm() {
  const [values, setValues] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reauth, setReauth] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    const problems = validateAuth("change-password", values);
    setErrors(problems); setError(""); setReauth("");
    if (Object.keys(problems).length) return;
    setBusy(true);
    try { await authRequest("change-password", values); window.location.replace(authHref("/login", window.location.pathname, { passwordChanged: "1" })); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to update your password."); if (error instanceof AuthError) { setErrors(error.errors); if (error.status === 401) window.location.replace(authHref("/login", window.location.pathname));
      else if (error.status === 403 && /recent|fresh|log.?in|re.?auth/i.test(error.message)) {
        setValues({ oldPassword: "", newPassword: "", confirmPassword: "" });
        setReauth(authHref("/login", window.location.pathname));
      } } }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} noValidate className="space-y-5">
    <h2 className="text-xl font-bold">Change password</h2>
    <p className="text-sm text-slate-500">Use 8–128 characters. You will need to log in again after changing your password.</p>
    <div className="grid gap-4 md:grid-cols-3">{([["oldPassword", "Current password"], ["newPassword", "New password"], ["confirmPassword", "Confirm new password"]] as const).map(([key, label]) => <label key={key} className="block text-sm font-semibold">{label}<input type={visible ? "text" : "password"} name={key} autoComplete={key === "oldPassword" ? "current-password" : "new-password"} maxLength={128} value={values[key]} onChange={event => setValues({ ...values, [key]: event.target.value })} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `${key}-error` : undefined} className="mt-2 w-full rounded-lg border border-[#dfe4e7] px-3 py-3 outline-[#067939]" />{errors[key] && <span id={`${key}-error`} className="mt-1 block text-xs text-red-600">{errors[key]}</span>}</label>)}</div>
    <label className="flex gap-2 text-sm"><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} />Show passwords</label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {reauth && <Link href={reauth} className="block text-sm font-semibold text-[#067939] underline">Log in again to change your password</Link>}
    <button type="submit" disabled={busy || !!reauth} className="rounded-lg bg-[#067939] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Updating…" : "Update password"}</button>
  </form>;
}
