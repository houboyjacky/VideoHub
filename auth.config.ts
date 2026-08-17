import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
        },
      },
    }),
  ],
  pages: {
    signIn: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      if (user?.email) {
        token.email = user.email.toLowerCase();
      }

      if (trigger === "update" && session) {
        if (session.status) token.status = session.status;
        if (session.name) token.name = session.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.userId as string) || "";
        session.user.email = (token.email as string) || "";
        session.user.name = (token.name as string) || session.user.name || "";
        session.user.status = (token.status as string) || "unregistered";
        session.user.isAdmin = !!token.isAdmin;
        session.user.groupIds = (token.groupIds as string[]) || [];
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
