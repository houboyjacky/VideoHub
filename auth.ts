import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

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
        return false;
      }

      const email = user.email.toLowerCase();
      const adminEmails = getAdminEmails();
      const isAdmin = adminEmails.includes(email);

      logger.auth(`使用者嘗試登入: ${email}`, { isAdmin, name: user.name });

      try {
        if (isAdmin) {
          // 管理員初次登入自動 Bootstrap 開通（不使用 upsert 避免 standalone MongoDB 交易報錯）
          const existing = await prisma.user.findUnique({
            where: { email },
          });

          if (existing) {
            await prisma.user.update({
              where: { email },
              data: {
                name: user.name || existing.name || "Admin",
                image: user.image || undefined,
                status: "approved",
                approvedAt: existing.approvedAt || new Date(),
              },
            });
            logger.auth(`管理員登入成功（既有用戶更新）: ${email}`);
          } else {
            await prisma.user.create({
              data: {
                email,
                name: user.name || "Admin",
                image: user.image || undefined,
                status: "approved",
                approvedAt: new Date(),
              },
            });
            logger.auth(`管理員初次登入自動 Bootstrap 建立成功: ${email}`);
          }
        } else {
          // 一般訪客登入
          const existing = await prisma.user.findUnique({
            where: { email },
          });

          if (existing) {
            logger.auth(`一般用戶登入: ${email}`, { status: existing.status });
          } else {
            logger.auth(`新訪客初次登入（未註冊狀態）: ${email}`);
          }
        }
        return true;
      } catch (err) {
        logger.error(`登入 callback 資料庫處理失敗: ${email}`, err);
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
});
