import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      status: "unregistered" | "pending" | "approved" | "rejected" | string;
      isAdmin: boolean;
      groupIds: string[];
    } & DefaultSession["user"];
  }

  interface User {
    status?: string;
    isAdmin?: boolean;
    groupIds?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    email?: string;
    name?: string;
    status?: string;
    isAdmin?: boolean;
    groupIds?: string[];
  }
}
