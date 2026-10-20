import AuthBrand from "./AuthBrand";

export default function AccountStatusScreen({ error, onRetry }: { error?: string; onRetry?: () => void }) {
  return (
    <main className="flex min-h-dvh w-full flex-1 items-center justify-center bg-[#F7FAF8] px-6 py-12 text-[#0F172A]">
      <div className="w-full max-w-[420px] text-center">
        <AuthBrand />
        <section
          role={error ? "alert" : "status"}
          aria-live="polite"
          aria-busy={!error}
          className="mt-8 rounded-3xl border border-[#E4ECE6] bg-white px-7 py-10 shadow-[0_12px_48px_-24px_rgba(15,50,30,0.18)] sm:px-10"
        >
          <div aria-hidden="true" className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF7F0]">
            {error ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className="h-6 w-6 text-[#067939]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v6m0 4h.01" />
              </svg>
            ) : (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-[#D7EBDD] border-t-[#067939] motion-safe:animate-spin" />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-[#067939]">
                  <rect x="4" y="4" width="6" height="6" rx="1.5" />
                  <rect x="14" y="4" width="6" height="6" rx="1.5" />
                  <rect x="4" y="14" width="6" height="6" rx="1.5" />
                  <rect x="14" y="14" width="6" height="6" rx="1.5" />
                </svg>
              </>
            )}
          </div>
          <h1 className="mt-6 text-xl font-bold tracking-tight">
            {error ? "Let’s try that again" : "Preparing your workspace"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">
            {error || "Just a moment while we get everything ready for you."}
          </p>
          {error ? (
            <button type="button" onClick={onRetry} className="mt-6 rounded-xl bg-[#067939] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#05662F] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#067939]">
              Try again
            </button>
          ) : (
            <div aria-hidden="true" className="mt-8 space-y-3 border-t border-[#F0F4F1] pt-7 motion-safe:animate-pulse">
              <div className="mx-auto h-2 w-3/4 rounded-full bg-[#EDF2EE]" />
              <div className="mx-auto h-2 w-1/2 rounded-full bg-[#F2F5F3]" />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
