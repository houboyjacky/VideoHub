import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractClientIp } from "@/lib/user-agent";
import { redeemInviteCodeUseCase } from "@/lib/application/use-cases/redeem-invite-code.usecase";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "請先登入 Google 帳號" }, { status: 401 });
    }

    const email = session.user.email;
    const sessionName = session.user.name || "會員";
    const sessionImage = session.user.image || undefined;
    const clientIp = extractClientIp(req.headers);

    const body = await req.json().catch(() => ({}));
    const { code } = body;

    const result = await redeemInviteCodeUseCase({
      email,
      sessionName,
      sessionImage,
      clientIp,
      code,
      reqHeaders: req.headers,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      autoApproved: result.autoApproved,
      assignedGroupsCount: result.assignedGroupsCount,
      userStatus: result.userStatus,
    });
  } catch (error) {
    console.error("Redeem Invite Error:", error);
    return NextResponse.json({ error: "兌換邀請碼時發生伺服器錯誤" }, { status: 500 });
  }
}
