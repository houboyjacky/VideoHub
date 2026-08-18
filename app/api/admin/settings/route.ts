import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import {
  getSystemSettingsUseCase,
  updateSystemSettingsUseCase,
} from "@/lib/application/use-cases/system-settings.usecase";
import { extractClientIp } from "@/lib/user-agent";

// GET: 取得全站動態設定（遮罩與狀態）
export async function GET() {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const settings = await getSystemSettingsUseCase();
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("[Admin Settings GET Error]:", error);
    return NextResponse.json({ error: "取得系統設定失敗" }, { status: 500 });
  }
}

// PUT: 更新全站動態設定
export async function PUT(req: NextRequest) {
  const check = await requireAdmin();
  if (!check.authorized) return check.response;

  try {
    const body = await req.json().catch(() => ({}));
    const clientIp = extractClientIp(req.headers);

    const result = await updateSystemSettingsUseCase({
      ...body,
      adminEmail: check.session.user?.email || "admin",
      adminUserName: check.session.user?.name || "管理員",
      reqHeaders: req.headers,
      clientIp,
    });

    return NextResponse.json({
      success: true,
      message: "系統動態設定已成功更新",
      settings: result.settings,
    });
  } catch (error) {
    console.error("[Admin Settings PUT Error]:", error);
    return NextResponse.json({ error: "更新系統設定失敗" }, { status: 500 });
  }
}
