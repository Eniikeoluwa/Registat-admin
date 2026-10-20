"use client";
import AccountStatusScreen from "./AccountStatusScreen";
import { createContext, useContext, useEffect, useState } from "react";
import { authRequest, AuthError, forgetEmail, type AuthUser } from "@/lib/auth/client";

const AccountContext = createContext<AuthUser | null>(null);
export const useAccount = () => useContext(AccountContext);
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () => authRequest("session", undefined, "GET").then(result => { if (active) { setUser(result.data); setError(""); } }).catch(error => {
      if (!active) return;
      if (error instanceof AuthError && [401, 403].includes(error.status)) window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      else setError(error instanceof Error ? error.message : "Unable to load your account.");
    });
    void load();
    const focus = () => { void load(); };
    window.addEventListener("focus", focus);
    return () => { active = false; window.removeEventListener("focus", focus); };
  }, []);
  if (error) return <AccountStatusScreen error={error} onRetry={() => window.location.reload()} />;
  if (!user) return <AccountStatusScreen />;
  return <AccountContext.Provider value={user}>{children}</AccountContext.Provider>;
}
export function AccountIdentity() {
  const user = useAccount();
  return <div><p className="font-bold">{user?.name}</p><p className="text-sm text-[#697993]">{user?.email}</p></div>;
}
export function AccountInitials() {
  const user = useAccount();
  return <>{user?.name.split(/\s+/).filter(Boolean).map(part => part[0]).slice(0, 2).join("").toUpperCase() || ""}</>;
}
export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div><button type="button" disabled={busy} className="px-3 py-2 text-sm font-semibold underline disabled:opacity-50" onClick={async () => {
    if (busy) return;
    setBusy(true); setError("");
    try { await authRequest("logout"); forgetEmail(); window.location.replace("/login"); }
    catch (error) { setError(error instanceof Error ? error.message : "Unable to sign out."); setBusy(false); }
  }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="text-xs text-red-600">{error}</p>}</div>;
}
