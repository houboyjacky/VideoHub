import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractClientIp } from "@/lib/user-agent";
import { updateUserProfileUseCase } from "@/lib/application/use-cases/update-user-profile.usecase";

// PATCH: 使用者修改自己的個人稱呼/姓名
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "請先登入帳號" }, { status: 401 });
    }

    const email = session.user.email;
    const clientIp = extractClientIp(req.headers);
    const body = await req.json().catch(() => ({}));
    const { name } = body;

    const result = await updateUserProfileUseCase({
      email,
      name,
      reqHeaders: req.headers,
      clientIp,
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
      user: result.user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "修改個人稱呼時發生伺服器錯誤" }, { status: 500 });
  }
}
