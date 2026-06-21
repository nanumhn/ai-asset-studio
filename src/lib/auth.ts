import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { env, isAuthConfigured, isDatabaseConfigured } from "@/lib/env";

/**
 * NextAuth v4 options.
 *
 * - Uses the Prisma adapter only when a DATABASE_URL is present so the app can
 *   still boot in environments without a DB (e.g. CI build, preview without env).
 * - Google OAuth provider is only attached when its credentials are configured.
 * - Session strategy is "jwt" so protected pages work even when the adapter is
 *   absent; when the adapter is present, users/accounts are persisted.
 */
export const authOptions: NextAuthOptions = {
  adapter: isDatabaseConfigured() ? PrismaAdapter(prisma) : undefined,
  session: { strategy: "jwt" },
  secret: env.NEXTAUTH_SECRET || "dev-insecure-secret-change-me",
  providers: isAuthConfigured()
    ? [
        GoogleProvider({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
        }),
      ]
    : [],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        session.user.id = token.uid as string;
      }
      return session;
    },
  },
};
