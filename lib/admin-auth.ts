import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "未授權：需要管理員權限" },
        { status: 403 }
      ),
      session: null,
    };
  }

  return {
    authorized: true as const,
    response: null,
    session,
  };
}
