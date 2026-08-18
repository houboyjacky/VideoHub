import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { extractClientIp } from "@/lib/user-agent";
import { validateProfileName } from "@/lib/domains/identity/profile-validator";
import { redeemInviteCodeUseCase } from "@/lib/application/use-cases/redeem-invite-code.usecase";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "請先登入 Google 帳號" },
        { status: 401 }
      );
    }

    const email = session.user.email.toLowerCase().trim();
    const clientIp = extractClientIp(req.headers);
    const body = await req.json().catch(() => ({}));
    const { name, inviteCode } = body;

    // 1. 稱呼校驗
    const profileValidation = validateProfileName(name);
    if (!profileValidation.isValid || !profileValidation.name) {
      return NextResponse.json(
        { error: profileValidation.error || "請填寫有效的稱呼或姓名" },
        { status: 400 }
      );
    }

    const cleanName = profileValidation.name;

    // 2. 若有填寫邀請碼，轉由 RedeemInviteCodeUseCase 處理
    if (inviteCode && typeof inviteCode === "string" && inviteCode.trim().length > 0) {
      const redeemResult = await redeemInviteCodeUseCase({
        email,
        sessionName: cleanName,
        sessionImage: session.user.image || undefined,
        clientIp,
        code: inviteCode.trim(),
        reqHeaders: req.headers,
      });

      if (!redeemResult.success) {
        return NextResponse.json(
          { error: redeemResult.error },
          { status: redeemResult.statusCode }
        );
      }

      // 同步更新使用者的 name
      await prisma.user.update({
        where: { email },
        data: { name: cleanName },
      });

      return NextResponse.json({
        success: true,
        message: redeemResult.message,
        autoApproved: redeemResult.autoApproved,
        status: redeemResult.userStatus,
      });
    }

    // 3. 無邀請碼註冊（直接送出待審核申請）
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.disabled) {
        return NextResponse.json(
          { error: "您的帳號已被停用，請聯絡管理員" },
          { status: 403 }
        );
      }

      if (user.status === "approved") {
        return NextResponse.json({
          success: true,
          message: "您的帳號已核准，無需重複申請",
          status: "approved",
        });
      }

      await prisma.user.update({
        where: { email },
        data: {
          name: cleanName,
          status: "pending",
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: cleanName,
          image: session.user.image || undefined,
          status: "pending",
          groupIds: [],
        },
      });
    }

    recordActivityLog({
      email,
      name: cleanName,
      image: session.user.image,
      userId: user.id,
      action: "register_submit_pending",
      status: "success",
      details: "使用者提交註冊申請，等待管理員手動審核",
      req,
      ip: clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "註冊申請已送出，請等待管理員審核",
      status: "pending",
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: "註冊處理時發生伺服器錯誤" },
      { status: 500 }
    );
  }
}
