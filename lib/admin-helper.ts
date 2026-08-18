import { prisma } from "@/lib/prisma";

/**
 * 動態獲取系統主要管理員之顯示名稱
 * 優先序：
 * 1. ADMIN_EMAILS 中第一位有效管理員於 User 資料表之 name
 * 2. NEXT_PUBLIC_ADMIN_NAME 環境變數
 * 3. 預設值「管理員」
 */
export async function getAdminDisplayName(): Promise<string> {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length > 0) {
    try {
      const adminUser = await prisma.user.findUnique({
        where: { email: adminEmails[0] },
      });
      if (adminUser?.name?.trim()) {
        return adminUser.name.trim();
      }
    } catch {
      // 若 DB 暫時無法連線則 fallback
    }
  }

  return process.env.NEXT_PUBLIC_ADMIN_NAME?.trim() || "管理員";
}
