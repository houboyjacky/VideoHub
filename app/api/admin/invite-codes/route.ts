import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET: 取得所有邀請碼清單
export async function GET() {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const [rawInviteCodes, groups] = await Promise.all([
      prisma.inviteCode.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.group.findMany(),
    ]);

    const groupMap = new Map(groups.map((g) => [g.id, { name: g.name, shareId: g.shareId }]));

    const inviteCodes = rawInviteCodes.map((code) => {
      const targetGroupIds = code.targetGroupIds || [];
      const targetGroupNames = targetGroupIds.map((id) => groupMap.get(id)?.name || "未知分組");
      const targetGroupShareIds = targetGroupIds.map((id) => groupMap.get(id)?.shareId || id);
      return {
        ...code,
        autoApprove: !!code.autoApprove,
        targetGroupIds,
        targetGroupNames,
        targetGroupShareIds,
        description: code.description || null,
      };
    });

    return NextResponse.json({ inviteCodes });
  } catch (error) {
    console.error("[Admin Invite Codes GET Error]:", error);
    return NextResponse.json({ error: "無法取得邀請碼清單" }, { status: 500 });
  }
}

// POST: 建立新邀請碼
export async function POST(req: Request) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const body = await req.json();
    const { customCode, maxUses, daysValid, autoApprove, targetGroupIds, description } = body;

    const parsedMaxUses = parseInt(maxUses || "1", 10);
    const parsedDays = parseInt(daysValid || "30", 10);

    if (isNaN(parsedMaxUses) || parsedMaxUses < 1) {
      return NextResponse.json({ error: "使用次數上限必須至少為 1 次" }, { status: 400 });
    }

    if (isNaN(parsedDays) || parsedDays < 1) {
      return NextResponse.json({ error: "有效天數必須至少為 1 天" }, { status: 400 });
    }

    // 生成隨機代碼或使用自訂代碼
    let code = customCode?.trim().toUpperCase();
    if (!code) {
      code = `STREAM-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    }

    // 檢查是否有衝突
    const existing = await prisma.inviteCode.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json({ error: `邀請碼 ${code} 已存在，請使用其他代碼` }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parsedDays);

    const safeTargetGroupIds = Array.isArray(targetGroupIds) ? targetGroupIds : [];

    const newInvite = await prisma.inviteCode.create({
      data: {
        code,
        maxUses: parsedMaxUses,
        expiresAt,
        autoApprove: !!autoApprove,
        targetGroupIds: safeTargetGroupIds,
        description: description?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, inviteCode: newInvite });
  } catch (error) {
    console.error("[Admin Invite Codes POST Error]:", error);
    return NextResponse.json({ error: "建立邀請碼失敗" }, { status: 500 });
  }
}
