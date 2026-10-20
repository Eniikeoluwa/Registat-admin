import type { Metadata } from "next";
import AuthBrand from "@/components/auth/AuthBrand";
import VerifyForm from "@/components/auth/VerifyForm";

export const metadata: Metadata = {
  title: "Verify your email — Registat",
  description: "Enter the 6-digit verification code sent to your email.",
};

export default function VerifyPage() {
  return (
    <main className="flex min-h-screen w-full items-start justify-center bg-white px-6 py-12 md:py-20">
      <div className="w-full max-w-md">
        <AuthBrand />
        <div className="mt-10">
          <VerifyForm />
        </div>
      </div>
    </main>
  );
}
