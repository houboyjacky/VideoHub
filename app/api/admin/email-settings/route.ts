import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getEmailConfigStatus, sendSingleProviderTestEmail } from "@/lib/email";

export async function GET() {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const config = getEmailConfigStatus();
    const currentAdminEmail = authCheck.session?.user?.email || "";

    return NextResponse.json({
      success: true,
      config,
      currentAdminEmail,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "獲取 Email 配置失敗" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const authCheck = await requireAdmin();
  if (!authCheck.authorized) return authCheck.response;

  try {
    const body = await req.json();
    const { provider, targetEmail } = body || {};

    if (provider !== "smtp" && provider !== "resend") {
      return NextResponse.json(
        { error: "請指定正確的發送管道 ('smtp' 或 'resend')" },
        { status: 400 }
      );
    }

    const config = getEmailConfigStatus();
    const destination =
      (typeof targetEmail === "string" && targetEmail.trim().length > 0
        ? targetEmail.trim()
        : authCheck.session?.user?.email || config.adminEmails[0]) || "";

    if (!destination || !destination.includes("@")) {
      return NextResponse.json(
        { error: "請提供有效的測試收件人 Email 地址" },
        { status: 400 }
      );
    }

    const result = await sendSingleProviderTestEmail({
      provider,
      to: destination,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          details: result.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      details: result.details,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "執行 Email 測試時發生錯誤" },
      { status: 500 }
    );
  }
}
