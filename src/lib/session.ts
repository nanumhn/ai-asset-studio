import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/** Server-side helper to read the current session. */
export function auth() {
  return getServerSession(authOptions);
}

/** Returns the current user id or null. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
