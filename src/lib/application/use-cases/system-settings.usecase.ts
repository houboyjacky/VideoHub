import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { sendEmail } from "@/lib/email";
import { buildTestEmailHtml } from "@/lib/domains/notification/templates";
import { maskSecret } from "@/lib/domains/notification/mailer-types";
import { getAdminDisplayName } from "@/lib/domains/identity/admin-policy";

export interface SystemSettingsDTO {
  // 品牌與外觀
  appName: string;
  adminName: string;
  contactEmail: string;
  // YouTube 設定
  youtubeApiKey: string;
  youtubeApiKeyMasked: string;
  youtubeChannelId: string;
  // 郵件設定
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassMasked: string;
  smtpSecure: boolean;
  emailFrom: string;
  resendApiKeyMasked: string;
  // 安全與限流
  rateLimitMaxAttempts: number;
  rateLimitLockoutMinutes: number;
  // 來源指示 (後台資料庫覆蓋 vs 環境變數)
  isCustomized: {
    appName: boolean;
    adminName: boolean;
    contactEmail: boolean;
    youtubeApiKey: boolean;
    youtubeChannelId: boolean;
    smtp: boolean;
    resend: boolean;
  };
}

const SETTINGS_KEY = "system_dynamic_settings";

/**
 * 讀取全站動態設定（遵循「1. 資料庫設定 ➜ 2. .env 環境變數 ➜ 3. 內建預設值」三層回退）
 */
export async function getSystemSettingsUseCase(): Promise<SystemSettingsDTO> {
  let dbConfig: any = {};
  try {
    const record = await prisma.systemConfig.findUnique({
      where: { key: SETTINGS_KEY },
    });
    if (record?.value && typeof record.value === "object") {
      dbConfig = record.value;
    }
  } catch (err) {
    console.warn("[SystemSettings] Failed to fetch DB config, fallback to env:", err);
  }

  // 1. 品牌外觀 (優先讀取 DB，若無則讀取 process.env，若無則回退預設)
  const appName = dbConfig.appName?.trim() || process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const adminName = dbConfig.adminName?.trim() || (await getAdminDisplayName());
  const contactEmail = dbConfig.contactEmail?.trim() || process.env.NEXT_PUBLIC_CONTACT_EMAIL || process.env.CONTACT_EMAIL || "";

  // 2. YouTube
  const youtubeApiKey = dbConfig.youtubeApiKey?.trim() || process.env.YOUTUBE_API_KEY || "";
  const youtubeChannelId = dbConfig.youtubeChannelId?.trim() || process.env.YOUTUBE_CHANNEL_ID || "";

  // 3. SMTP / 郵件
  const smtpHost = dbConfig.smtpHost?.trim() || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(dbConfig.smtpPort) || Number(process.env.SMTP_PORT) || 465;
  const smtpUser = dbConfig.smtpUser?.trim() || process.env.SMTP_USER || "";
  const rawSmtpPass = dbConfig.smtpPass?.trim() || process.env.SMTP_PASS || "";
  const smtpSecure = dbConfig.smtpSecure !== undefined ? Boolean(dbConfig.smtpSecure) : (process.env.SMTP_SECURE === "true" || smtpPort === 465);
  const emailFrom = dbConfig.emailFrom?.trim() || process.env.EMAIL_FROM || `${appName} <noreply@your-domain.com>`;
  const rawResendKey = dbConfig.resendApiKey?.trim() || process.env.RESEND_API_KEY || "";

  // 4. 安全限流
  const rateLimitMaxAttempts = Number(dbConfig.rateLimitMaxAttempts) || Number(process.env.RATE_LIMIT_MAX_ATTEMPTS) || 5;
  const rateLimitLockoutMinutes = Number(dbConfig.rateLimitLockoutMinutes) || Number(process.env.RATE_LIMIT_LOCKOUT_MINUTES) || 15;

  return {
    appName,
    adminName,
    contactEmail,
    youtubeApiKey,
    youtubeApiKeyMasked: maskSecret(youtubeApiKey),
    youtubeChannelId,
    smtpHost,
    smtpPort,
    smtpUser,
    smtpPassMasked: maskSecret(rawSmtpPass),
    smtpSecure,
    emailFrom,
    resendApiKeyMasked: maskSecret(rawResendKey),
    rateLimitMaxAttempts,
    rateLimitLockoutMinutes,
    isCustomized: {
      appName: Boolean(dbConfig.appName),
      adminName: Boolean(dbConfig.adminName),
      contactEmail: Boolean(dbConfig.contactEmail),
      youtubeApiKey: Boolean(dbConfig.youtubeApiKey),
      youtubeChannelId: Boolean(dbConfig.youtubeChannelId),
      smtp: Boolean(dbConfig.smtpUser || dbConfig.smtpPass),
      resend: Boolean(dbConfig.resendApiKey),
    },
  };
}

/**
 * 取得當前網站品牌與聯絡資訊（輕量級）
 */
export async function getAppBrandConfig(): Promise<{
  appName: string;
  adminName: string;
  contactEmail: string;
}> {
  const settings = await getSystemSettingsUseCase();
  return {
    appName: settings.appName,
    adminName: settings.adminName,
    contactEmail: settings.contactEmail,
  };
}

export interface UpdateSettingsInput {
  appName?: string;
  adminName?: string;
  contactEmail?: string;
  youtubeApiKey?: string;
  youtubeChannelId?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  emailFrom?: string;
  resendApiKey?: string;
  rateLimitMaxAttempts?: number;
  rateLimitLockoutMinutes?: number;
  adminEmail: string;
  adminUserName?: string;
  reqHeaders?: Headers | Request | null;
  clientIp?: string;
}

/**
 * 更新全站動態設定（支援「留空即回退」與「密碼保留」機制）
 */
export async function updateSystemSettingsUseCase(input: UpdateSettingsInput) {
  const { adminEmail, adminUserName = "管理員", reqHeaders, clientIp } = input;

  // 取得現有資料庫設定
  let existingDb: any = {};
  const record = await prisma.systemConfig.findUnique({
    where: { key: SETTINGS_KEY },
  });
  if (record?.value && typeof record.value === "object") {
    existingDb = record.value;
  }

  const updatedValue: any = { ...existingDb };

  // 1. 品牌與外觀
  if (input.appName !== undefined) updatedValue.appName = input.appName.trim() || null;
  if (input.adminName !== undefined) updatedValue.adminName = input.adminName.trim() || null;
  if (input.contactEmail !== undefined) updatedValue.contactEmail = input.contactEmail.trim() || null;

  // 2. YouTube
  if (input.youtubeApiKey !== undefined) {
    const keyTrim = input.youtubeApiKey.trim();
    if (!keyTrim.includes("••••")) {
      updatedValue.youtubeApiKey = keyTrim || null;
    }
  }
  if (input.youtubeChannelId !== undefined) {
    updatedValue.youtubeChannelId = input.youtubeChannelId.trim() || null;
  }

  // 3. SMTP / 郵件
  if (input.smtpHost !== undefined) updatedValue.smtpHost = input.smtpHost.trim() || null;
  if (input.smtpPort !== undefined) updatedValue.smtpPort = Number(input.smtpPort) || null;
  if (input.smtpUser !== undefined) updatedValue.smtpUser = input.smtpUser.trim() || null;
  if (input.smtpPass !== undefined) {
    const passTrim = input.smtpPass.trim();
    if (!passTrim.includes("••••")) {
      updatedValue.smtpPass = passTrim || null;
    }
  }
  if (input.smtpSecure !== undefined) updatedValue.smtpSecure = Boolean(input.smtpSecure);
  if (input.emailFrom !== undefined) updatedValue.emailFrom = input.emailFrom.trim() || null;
  if (input.resendApiKey !== undefined) {
    const resendTrim = input.resendApiKey.trim();
    if (!resendTrim.includes("••••")) {
      updatedValue.resendApiKey = resendTrim || null;
    }
  }

  // 4. 限流
  if (input.rateLimitMaxAttempts !== undefined) updatedValue.rateLimitMaxAttempts = Number(input.rateLimitMaxAttempts) || null;
  if (input.rateLimitLockoutMinutes !== undefined) updatedValue.rateLimitLockoutMinutes = Number(input.rateLimitLockoutMinutes) || null;

  // 儲存至資料庫 (相容於 Prisma Mock)
  let saved: any;
  if (record) {
    saved = await prisma.systemConfig.update({
      where: { key: SETTINGS_KEY },
      data: { value: updatedValue },
    });
  } else {
    saved = await prisma.systemConfig.create({
      data: { key: SETTINGS_KEY, value: updatedValue },
    });
  }

  // 記錄活動日誌
  recordActivityLog({
    email: adminEmail,
    name: adminUserName,
    action: "admin_update_system_settings",
    status: "success",
    details: `管理員更新全站系統動態設定（品牌、YouTube、郵件或安全策略）`,
    req: reqHeaders,
    ip: clientIp,
  });

  return { success: true, statusCode: 200, settings: saved?.value || updatedValue };
}

/**
 * 測試發送驗證信件
 */
export async function sendTestEmailUseCase(targetEmail: string, adminName: string) {
  const settings = await getSystemSettingsUseCase();
  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  const html = buildTestEmailHtml({
    adminName,
    appName: settings.appName,
    testedAt: now,
    provider: settings.smtpUser ? "Gmail SMTP" : "Resend / Default",
  });

  const result = await sendEmail({
    to: targetEmail,
    subject: `【${settings.appName}】系統郵件連線測試信`,
    html,
  });

  return result;
}
