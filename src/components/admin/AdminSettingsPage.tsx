"use client";
import Link from "next/link";
import ChangePasswordForm from "@/components/auth/ChangePasswordForm";
import { LogoutButton, useAccount } from "@/components/auth/AccountIdentity";
import { panelClass } from "@/components/applications/UI";
export default function AdminSettingsPage() {
  const account = useAccount();
  return <main className="mx-auto max-w-4xl space-y-6 p-5 sm:p-8"><header><h1 className="text-3xl font-bold">Account settings</h1><p className="mt-2 text-slate-500">Your account and security.</p></header><section className={panelClass}><h2 className="text-xl font-semibold">Personal information</h2><dl className="mt-4 space-y-3"><div><dt>Name</dt><dd>{account?.name}</dd></div><div><dt>Email</dt><dd>{account?.email}</dd></div><div><dt>Phone</dt><dd>{account?.phone || "Not provided"}</dd></div><div><dt>Role</dt><dd>{account?.role}</dd></div></dl></section><section className={panelClass}><h2 className="mb-4 text-xl font-semibold">Change password</h2><ChangePasswordForm /></section><section className={`${panelClass} space-y-4`}><h2 className="text-xl font-semibold">Account access</h2><Link className="block text-[#067939] underline" href="/admin/customers?role=admin">Manage admin account status</Link><LogoutButton /><p className="text-sm text-slate-500">Profile editing, admin invitations, notification preferences and audit logs are unavailable in the current backend API.</p></section></main>;
}
