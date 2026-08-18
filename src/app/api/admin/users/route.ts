import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.trim().toLowerCase();

    const where: any = {};
    if (status) where.status = status;

    let users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (search) {
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(search) ||
          u.email?.toLowerCase().includes(search) ||
          u.usedInviteCode?.toLowerCase().includes(search)
      );
    }

    const groups = await prisma.group.findMany();
    const groupMap = new Map(groups.map((g) => [g.id, g.name]));

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const usersWithGroups = users.map((u) => {
      const isUserAdmin = adminEmails.includes((u.email || "").toLowerCase());
      const safeGroupIds = Array.isArray(u.groupIds) ? u.groupIds : [];
      return {
        ...u,
        disabled: !!u.disabled,
        usedInviteCode: u.usedInviteCode || null,
        lastLoginAt: u.lastLoginAt || null,
        groupIds: safeGroupIds,
        isAdmin: isUserAdmin,
        groupNames: safeGroupIds.map((gid) => groupMap.get(gid) || "未知分組"),
      };
    });

    return NextResponse.json({ users: usersWithGroups, groups });
  } catch (error) {
    console.error("[Admin Users GET Error]:", error);
    return NextResponse.json({ error: "無法取得用戶清單" }, { status: 500 });
  }
}
