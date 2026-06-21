"use client";

import { signIn } from "next-auth/react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-white/60">
        Sign in to download assets, manage your subscription, and generate.
      </p>
      <button
        onClick={() => signIn("google", { callbackUrl })}
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-lg border border-white/15 bg-white px-4 py-3 font-medium text-black hover:bg-white/90"
      >
        <span className="inline-block h-5 w-5 rounded-full bg-gradient-to-br from-red-500 via-yellow-500 to-blue-500" />
        Continue with Google
      </button>
      <p className="mt-6 text-xs text-white/40">
        Google OAuth must be configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInInner />
    </Suspense>
  );
}
