import AuthBrand from "@/components/auth/AuthBrand";
import PasswordRecoveryForm from "@/components/auth/PasswordRecoveryForm";
export const metadata = { title: "Reset password — Registat" };
export default function Page() { return <main className="flex min-h-screen justify-center bg-white px-6 py-16"><div className="w-full max-w-md"><AuthBrand /><PasswordRecoveryForm reset /></div></main>; }
