import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where = status ? { status } : {};

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const groups = await prisma.group.findMany();
    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    const usersWithGroups = users.map((u) => ({
      ...u,
      groupNames: u.groupIds.map((gid) => groupMap.get(gid) || "未知分組"),
    }));

    return NextResponse.json({ users: usersWithGroups, groups });
  } catch (error) {
    console.error("[Admin Users GET Error]:", error);
    return NextResponse.json({ error: "無法取得用戶清單" }, { status: 500 });
  }
}
