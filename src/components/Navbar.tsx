"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b12]/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block h-6 w-6 rounded bg-gradient-to-br from-brand-light to-brand" />
          <span>AI Asset Studio</span>
        </Link>

        <div className="flex items-center gap-6 text-sm">
          <Link href="/gallery" className="text-white/70 hover:text-white">
            Gallery
          </Link>
          <Link href="/pricing" className="text-white/70 hover:text-white">
            Pricing
          </Link>
          <Link href="/generate" className="text-white/70 hover:text-white">
            Generate
          </Link>

          {status === "loading" ? (
            <span className="text-white/40">…</span>
          ) : session ? (
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-white/70 hover:text-white">
                {session.user?.name?.split(" ")[0] ?? "Account"}
              </Link>
              <button
                onClick={() => signOut()}
                className="rounded-md border border-white/15 px-3 py-1.5 text-white/80 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="rounded-md bg-brand px-3 py-1.5 font-medium text-white hover:bg-brand-dark"
            >
              Sign in
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
