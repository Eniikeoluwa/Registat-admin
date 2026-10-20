import type { Metadata } from "next";
import Image from "next/image";
import AuthBrand from "@/components/auth/AuthBrand";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in — Registat",
  description:
    "Log in to your Registat account to manage your business applications.",
};

export default function LoginPage() {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 bg-white lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white px-6 py-6 lg:py-10">
        <div className="w-full max-w-md">
          <AuthBrand />

          <div className="mt-6 lg:mt-8">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#0F172A] md:text-[2rem]">
              Welcome back to Registat
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#475569] md:text-base">
              Log in to track your applications, manage your companies, and
              keep your business compliant.
            </p>

            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden bg-[#F6F7F7] lg:block">
        <Image
          src="/signupholder.svg"
          alt="Registat dashboard preview"
          width={437}
          height={522}
          priority
          className="absolute right-0 top-1/2 h-auto w-full max-w-[480px] -translate-y-1/2"
        />
      </div>
    </main>
  );
}
