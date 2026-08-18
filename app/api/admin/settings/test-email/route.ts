import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendTestEmailUseCase } from "@/lib/application/use-cases/system-settings.usecase";

// POST: 發送測試信件
export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const body = await req.json().catch(() => ({}));
    const { targetEmail } = body;

    const emailToSend = (targetEmail || check.session.user?.email || "").trim();
    if (!emailToSend || !emailToSend.includes("@")) {
      return NextResponse.json({ error: "請輸入有效的測試收件 Email" }, { status: 400 });
    }

    const adminName = check.session.user?.name || "管理員";
    const result = await sendTestEmailUseCase(emailToSend, adminName);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: typeof result.error === "object" ? JSON.stringify(result.error) : String(result.error || "郵件發送失敗"),
        provider: result.provider,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `測試信已成功寄出至 ${emailToSend}`,
      provider: result.provider,
    });
  } catch (error) {
    console.error("[Test Email Error]:", error);
    return NextResponse.json({ error: "發送測試信時發生伺服器錯誤" }, { status: 500 });
  }
}
