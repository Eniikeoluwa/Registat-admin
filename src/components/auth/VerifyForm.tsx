"use client";

import Link from "next/link";
import { useAuthReturnTo } from "./useAuthReturnTo";
import { authRequest, rememberEmail, forgetEmail } from "@/lib/auth/client";
import { tokenValid, emailValid, authHref } from "@/lib/auth/validation";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;
const PLACEHOLDER_EMAIL = "you@example.com";

type StoredSignup = { email?: string };

function subscribe() {
  return () => {};
}

function getEmailSnapshot(): string {
  if (typeof window === "undefined") return PLACEHOLDER_EMAIL;
  try {
    const raw = window.sessionStorage.getItem("registat:signup");
    if (!raw) return new URLSearchParams(window.location.search).get("email") || PLACEHOLDER_EMAIL;
    const parsed = JSON.parse(raw) as StoredSignup;
    return new URLSearchParams(window.location.search).get("email") || parsed.email || PLACEHOLDER_EMAIL;
  } catch {
    return PLACEHOLDER_EMAIL;
  }
}

function getEmailServerSnapshot(): string {
  return PLACEHOLDER_EMAIL;
}

export default function VerifyForm() {
  const router = useRouter();
  const returnTo = useAuthReturnTo();
  const [digits, setDigits] = useState<string[]>(
    () => Array.from({ length: CODE_LENGTH }, () => "")
  );
  const email = useSyncExternalStore(
    subscribe,
    getEmailSnapshot,
    getEmailServerSnapshot
  );
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const token = useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get("token") || "", () => "");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setInterval(() => {
      setResendIn((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resendIn]);

  const code = digits.join("");
  const canSubmit = code.length === CODE_LENGTH && digits.every((d) => d !== "");

  const focusIndex = (i: number) => {
    const el = inputRefs.current[i];
    if (el) el.focus();
  };

  const updateDigit = (i: number, value: string) => {
    const cleaned = value.replace(/\D/g, "");
    setDigits((prev) => {
      const next = [...prev];
      if (cleaned.length <= 1) {
        next[i] = cleaned;
        return next;
      }
      const chars = cleaned.slice(0, CODE_LENGTH - i).split("");
      chars.forEach((c, idx) => {
        next[i + idx] = c;
      });
      return next;
    });
    if (cleaned.length === 1) {
      focusIndex(Math.min(i + 1, CODE_LENGTH - 1));
    } else if (cleaned.length > 1) {
      focusIndex(Math.min(i + cleaned.length, CODE_LENGTH - 1));
    }
  };

  const handleChange = (i: number) => (e: ChangeEvent<HTMLInputElement>) => {
    updateDigit(i, e.target.value);
  };

  const handleKeyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        setDigits((prev) => {
          const next = [...prev];
          next[i] = "";
          return next;
        });
        return;
      }
      if (i > 0) {
        focusIndex(i - 1);
        setDigits((prev) => {
          const next = [...prev];
          next[i - 1] = "";
          return next;
        });
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusIndex(i - 1);
    } else if (e.key === "ArrowRight" && i < CODE_LENGTH - 1) {
      focusIndex(i + 1);
    }
  };

  const handlePaste = (i: number) => (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const chars = pasted.slice(0, CODE_LENGTH - i).split("");
    setDigits((prev) => {
      const next = [...prev];
      chars.forEach((c, idx) => {
        next[i + idx] = c;
      });
      return next;
    });
    focusIndex(Math.min(i + chars.length, CODE_LENGTH - 1));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit || busy) return;
    setError(""); setNotice("");
    if (!tokenValid(token)) { setError("This verification link is incomplete. Please contact support for help verifying your email."); return; }
    setBusy(true);
    try {
      await authRequest("verify", { token, otp: code });
      forgetEmail();
      router.replace(authHref("/login", returnTo, { verified: "1" }));
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to verify your email."); }
    finally { setBusy(false); }
  };

  const handleResend = async () => {
    if (resendIn > 0 || resending || busy) return;
    const targetEmail = (resendEmail || (email === PLACEHOLDER_EMAIL ? "" : email)).trim();
    setError(""); setNotice("");
    if (!emailValid(targetEmail)) { setError("Enter your account email address to resend your code."); return; }
    setResending(true);
    try {
      const result = await authRequest("resend-verification", { email: targetEmail });
      rememberEmail(targetEmail);
      setNotice(result.message || "A new verification code has been requested.");
      setResendIn(RESEND_SECONDS);
      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      focusIndex(0);
      // Resending invalidates the previous token. Only a new email link can supply its replacement.
      window.history.replaceState(null, "", authHref("/verify", returnTo, { email: targetEmail }));
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to resend your code."); }
    finally { setResending(false); }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Link
        href={authHref("/login", returnTo)}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] transition hover:text-[#0F172A]"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Go back
      </Link>

      <form onSubmit={handleSubmit} className="mt-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] md:text-4xl">
          Check your inbox
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#475569]">
          Enter the 6-digit verification code for{" "}
          <span className="font-semibold text-[#0F172A] underline underline-offset-4">
            {email}
          </span>
          . Use the complete verification link from your email to continue.
        </p>

        {!tokenValid(token) && <p role="status" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Open the complete verification link from your email. If you received only a code, <a href="mailto:support@registat.com" className="underline">contact support</a> to finish verification.</p>}
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-green-700">{notice}</p>}
        <p className="mt-8 text-center text-sm font-semibold text-[#0F172A]">
          Enter the 6-digit code
        </p>

        <div
          className="mt-4 flex items-center justify-center gap-2 sm:gap-3"
          role="group"
          aria-label="Verification code"
        >
          {digits.map((digit, i) => {
            const isSeparator = i === 3;
            return (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                {isSeparator && (
                  <span aria-hidden className="text-2xl font-semibold text-[#94A3B8]">
                    -
                  </span>
                )}
                <input
                  ref={(el) => {
                    inputRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={i === 0 ? 6 : 1}
                  value={digit}
                  onChange={handleChange(i)}
                  onKeyDown={handleKeyDown(i)}
                  onPaste={handlePaste(i)}
                  aria-label={`Digit ${i + 1}`}
                  className="h-14 w-12 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-center text-xl font-semibold text-[#0F172A] outline-none transition focus:border-[#067939] focus:bg-white focus:ring-2 focus:ring-[#067939]/20 sm:w-14"
                />
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={!canSubmit || busy || resending || !tokenValid(token)}
          className="mt-8 w-full rounded-lg bg-[#067939] px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-[#05662F] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
        >
          {busy ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-[#475569]">
        <p>Didn&apos;t receive the code?</p>
        <label className="mt-3 block text-left">Account email
          <input type="email" autoComplete="email" maxLength={254} value={resendEmail} onChange={event => setResendEmail(event.target.value)} placeholder={email === PLACEHOLDER_EMAIL ? "Your account email" : email} className="mt-2 w-full rounded-lg border border-[#E2E8F0] px-3 py-2" />
        </label>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendIn > 0 || resending || busy}
          className="mt-2 font-semibold text-[#067939] transition hover:underline disabled:cursor-not-allowed disabled:text-[#94A3B8] disabled:no-underline"
        >
          {resending
            ? "Resending…"
            : resendIn > 0
              ? `Resend code (in ${resendIn}s)`
              : "Resend code"}
        </button>
      </div>
    </div>
  );
}
