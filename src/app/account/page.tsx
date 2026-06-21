import Link from "next/link";
import { auth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">You are not signed in</h1>
        <p className="mt-2 text-white/60">
          Sign in to view your subscription and downloads.
        </p>
        <Link
          href="/signin"
          className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  let subscription: { plan: string; status: string; currentPeriodEnd: Date | null } | null =
    null;
  let downloadCount = 0;
  if (isDatabaseConfigured() && session.user?.id) {
    try {
      subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
        select: { plan: true, status: true, currentPeriodEnd: true },
      });
      downloadCount = await prisma.download.count({
        where: { userId: session.user.id },
      });
    } catch {
      // DB unreachable — show defaults.
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">Account</h1>

      <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/40">Name</dt>
            <dd>{session.user?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/40">Email</dt>
            <dd>{session.user?.email ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Subscription</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/40">Plan</dt>
            <dd>{subscription?.plan ?? "FREE"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/40">Status</dt>
            <dd>{subscription?.status ?? "INACTIVE"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-white/40">Downloads</dt>
            <dd>{downloadCount}</dd>
          </div>
        </dl>
        {(!subscription || subscription.plan === "FREE") && (
          <Link
            href="/pricing"
            className="mt-6 inline-block rounded-lg bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
          >
            Upgrade
          </Link>
        )}
      </section>
    </div>
  );
}
