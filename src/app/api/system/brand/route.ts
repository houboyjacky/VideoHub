import { NextResponse } from "next/server";
import { getAppBrandConfig } from "@/lib/application/use-cases/system-settings.usecase";

export const dynamic = "force-dynamic";

// GET: 公開取得網站品牌、管理員稱呼與聯絡信箱（三層回退架構）
export async function GET() {
  try {
    const config = await getAppBrandConfig();
    return NextResponse.json({
      success: true,
      appName: config.appName,
      adminName: config.adminName,
      contactEmail: config.contactEmail,
    });
  } catch (error) {
    return NextResponse.json({
      success: true,
      appName: process.env.NEXT_PUBLIC_APP_NAME || "VideoHub",
      adminName: process.env.NEXT_PUBLIC_ADMIN_NAME || "管理員",
      contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
    });
  }
}
