import { prisma } from "@/lib/prisma";

export const DEFAULT_ADMIN_FALLBACK = "管理員";

/**
 * 領域規則：取得管理員在 UI 上的動態顯示名稱
 */
export async function getAdminDisplayName(): Promise<string> {
  try {
    const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsRaw
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (adminEmails.length > 0) {
      const adminUser = await prisma.user.findFirst({
        where: {
          email: { in: adminEmails },
        },
      });

      if (adminUser?.name && adminUser.name.trim() !== "") {
        return adminUser.name.trim();
      }
    }

    if (process.env.NEXT_PUBLIC_ADMIN_NAME && process.env.NEXT_PUBLIC_ADMIN_NAME.trim() !== "") {
      return process.env.NEXT_PUBLIC_ADMIN_NAME.trim();
    }

    return DEFAULT_ADMIN_FALLBACK;
  } catch (error) {
    console.error("Error fetching admin display name:", error);
    return process.env.NEXT_PUBLIC_ADMIN_NAME?.trim() || DEFAULT_ADMIN_FALLBACK;
  }
}

/**
 * 領域規則：判斷特定 Email 是否具備管理員權限
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const adminEmailsRaw = process.env.ADMIN_EMAILS || "";
  const adminEmails = adminEmailsRaw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase());
}
