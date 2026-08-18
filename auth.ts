import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { recordActivityLog } from "@/lib/audit-log";

const getAdminEmails = (): string[] => {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!user.email) {
        logger.auth("Google 登入拒絕：缺少 Email", { user });
        recordActivityLog({
          email: "unknown",
          name: user.name || "未命名訪客",
          action: "login",
          status: "failed",
          details: "Google 登入拒絕：缺少 Email",
        });
        return false;
      }

      const email = user.email.toLowerCase();
      const adminEmails = getAdminEmails();
      const isAdmin = adminEmails.includes(email);

      logger.auth(`使用者嘗試登入: ${email}`, { isAdmin, name: user.name });

      try {
        let dbUserId: string | null = null;
        let roleDetail = isAdmin ? "管理員登入" : "一般用戶登入";

        if (isAdmin) {
          // 管理員初次登入自動 Bootstrap 開通（不使用 upsert 避免 standalone MongoDB 交易報錯）
          const existing = await prisma.user.findUnique({
            where: { email },
          });

          if (existing) {
            dbUserId = existing.id;
            await prisma.user.update({
              where: { email },
              data: {
                name: user.name || existing.name || "Admin",
                image: user.image || undefined,
                status: "approved",
                approvedAt: existing.approvedAt || new Date(),
                lastLoginAt: new Date(),
              },
            });
            logger.auth(`管理員登入成功（既有用戶更新）: ${email}`);
          } else {
            const created = await prisma.user.create({
              data: {
                email,
                name: user.name || "Admin",
                image: user.image || undefined,
                status: "approved",
                approvedAt: new Date(),
                lastLoginAt: new Date(),
              },
            });
            dbUserId = created.id;
            roleDetail = "管理員初次登入（自動開通）";
            logger.auth(`管理員初次登入自動 Bootstrap 建立成功: ${email}`);
          }
        } else {
          // 一般訪客登入
          const existing = await prisma.user.findUnique({
            where: { email },
          });

          if (existing) {
            dbUserId = existing.id;

            // 檢查帳號是否被停用
            if (existing.disabled) {
              logger.auth(`已停用帳號嘗試登入遭攔截: ${email}`);
              recordActivityLog({
                email,
                name: user.name || existing.name || "Google 用戶",
                image: user.image || null,
                userId: dbUserId,
                action: "login",
                status: "failed",
                details: "登入攔截：該帳號已被管理員停用",
              });
              return "/auth/disabled";
            }

            // 更新最後活躍時間
            await prisma.user.update({
              where: { email },
              data: {
                name: user.name || existing.name,
                image: user.image || undefined,
                lastLoginAt: new Date(),
              },
            });

            roleDetail = `用戶登入（狀態: ${existing.status}）`;
            logger.auth(`一般用戶登入: ${email}`, { status: existing.status });
          } else {
            roleDetail = "訪客初次登入（待填邀請碼）";
            logger.auth(`新訪客初次登入（未註冊狀態）: ${email}`);
          }
        }

        // 記錄登入活動日誌
        recordActivityLog({
          email,
          name: user.name || "Google 用戶",
          image: user.image || null,
          userId: dbUserId,
          action: "login",
          status: "success",
          details: roleDetail,
        });

        return true;
      } catch (err) {
        logger.error(`登入 callback 資料庫處理失敗: ${email}`, err);
        recordActivityLog({
          email,
          name: user.name || "Google 用戶",
          image: user.image || null,
          action: "login",
          status: "failed",
          details: `登入例外錯誤: ${err instanceof Error ? err.message : String(err)}`,
        });
        return false;
      }
    },

    async jwt(params) {
      const { token, user, trigger, session } = params;
      let updatedToken = token;
      if (authConfig.callbacks?.jwt) {
        updatedToken = (await authConfig.callbacks.jwt(params)) || token;
      }

      if (updatedToken.email) {
        const email = updatedToken.email as string;
        const adminEmails = getAdminEmails();
        const isAdmin = adminEmails.includes(email);
        updatedToken.isAdmin = isAdmin;

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email },
          });

          if (dbUser) {
            updatedToken.userId = dbUser.id;
            updatedToken.status = dbUser.status;
            updatedToken.name = dbUser.name;
            updatedToken.groupIds = dbUser.groupIds;
            updatedToken.disabled = !!dbUser.disabled;
          } else if (isAdmin) {
            updatedToken.status = "approved";
          } else {
            updatedToken.status = "unregistered";
          }
        } catch (err) {
          logger.error(`JWT 查詢用戶失敗: ${email}`, err);
        }
      }

      return updatedToken;
    },
  },
  events: {
    async signOut(message) {
      try {
        const token = "token" in message ? message.token : null;
        const session = "session" in message ? (message.session as any) : null;
        const email = (token?.email || session?.user?.email || "") as string;
        const name = (token?.name || session?.user?.name || "") as string;

        if (email) {
          logger.auth(`使用者已登出: ${email}`);
          recordActivityLog({
            email,
            name: name || null,
            action: "logout",
            status: "success",
            details: "使用者主動登出系統",
          });
        }
      } catch (err) {
        logger.error("登出日誌紀錄失敗", err);
      }
    },
  },
});
