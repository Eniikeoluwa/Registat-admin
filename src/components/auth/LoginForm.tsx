"use client";

import Link from "next/link";
import { useAuthReturnTo } from "./useAuthReturnTo";
import { authRequest, AuthError, rememberEmail } from "@/lib/auth/client";
import { validateAuth, safeReturnTo, authHref } from "@/lib/auth/validation";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  useState,
  useSyncExternalStore,
} from "react";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const returnTo = useAuthReturnTo();
  const status = useSyncExternalStore(() => () => {}, () => {
    const params = new URLSearchParams(window.location.search);
    return params.has("passwordChanged") ? "Password changed. Log in with your new password." : params.has("verified") ? "Email verified. You can now log in." : "";
  }, () => "");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required");
      return false;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) {
      validateEmail(e.target.value);
    }
  };

  const handleEmailBlur = (e: FocusEvent<HTMLInputElement>) => {
    if (e.target.value) validateEmail(e.target.value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    const values = { email: email.trim(), password };
    const errors = validateAuth("login", values);
    setFieldErrors(errors); setEmailError(errors.email || null); setError("");
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      const result = await authRequest("login", values);
      router.replace(safeReturnTo(new URLSearchParams(window.location.search).get("next"), result.data.role));
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to log in.");
      if (error instanceof AuthError) { setFieldErrors(error.errors); if (error.errors.email) setEmailError(error.errors.email); }
      if (error instanceof AuthError && error.status === 403) rememberEmail(values.email);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3.5">
      {status && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{status}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-[#0F172A]"
        >
          Email
        </label>
        <input
          maxLength={254}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="youremail@email.com"
          value={email}
          onChange={handleEmailChange}
          onBlur={handleEmailBlur}
          aria-invalid={emailError ? "true" : "false"}
          aria-describedby={emailError ? "login-email-error" : undefined}
          className={`mt-1.5 w-full rounded-lg border bg-[#F8FAFC] px-4 py-2.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:bg-white focus:ring-2 ${
            emailError
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/15"
              : "border-[#E2E8F0] focus:border-[#067939] focus:ring-[#067939]/20"
          }`}
        />
        {emailError && (
          <p id="login-email-error" className="mt-1 text-xs text-[#DC2626]">
            {emailError}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-[#0F172A]"
          >
            Password
          </label>
          <Link
            href={authHref("/forgot-password", returnTo)}
            className="text-xs font-semibold text-[#067939] transition hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-1.5">
          <input
            maxLength={128}
            aria-invalid={!!fieldErrors.password}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password here"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 pr-12 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition focus:border-[#067939] focus:bg-white focus:ring-2 focus:ring-[#067939]/20"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-[#94A3B8] transition hover:text-[#475569]"
          >
            {showPassword ? (
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <path d="M1 1l22 22" />
              </svg>
            ) : (
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {fieldErrors.password && <p id="password-error" role="alert" className="text-xs text-red-600">{fieldErrors.password}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-[#067939] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#05662F]"
      >
        {busy ? "Logging in…" : "Log in"}
      </button>

      <p className="text-center text-xs text-[#475569]">Need to verify your email? <Link href={authHref("/verify", returnTo)} className="font-semibold text-[#067939] underline">Verify or resend code</Link></p>
      <div className="flex items-center gap-4 py-1">
        <span className="h-px flex-1 bg-[#E2E8F0]" />
        <span className="text-xs text-[#94A3B8]">or</span>
        <span className="h-px flex-1 bg-[#E2E8F0]" />
      </div>

      <button
        type="button"
        disabled
        title="Google sign-in is not available yet"
        className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-6 py-2.5 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F1F5F9]"
      >
        <GoogleIcon />
        Google sign-in coming soon
      </button>

      <p className="text-center text-xs text-[#475569]">Admin access is managed by your organization.</p>
    </form>
  );
}
