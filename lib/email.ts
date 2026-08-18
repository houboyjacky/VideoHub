import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const createSmtpTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "465", 10),
    secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendMailOptions): Promise<{ success: boolean; provider: string; error?: unknown }> {
  const fromAddress =
    process.env.EMAIL_FROM || "VideoHub <noreply@your-domain.com>";

  // 1. 優先嘗試 Gmail SMTP (Nodemailer)
  const transporter = createSmtpTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });
      console.log(`[Email] Successfully sent email to ${to} via Gmail SMTP`);
      return { success: true, provider: "smtp" };
    } catch (smtpErr) {
      console.warn(
        `[Email] SMTP send failed, attempting Resend fallback:`,
        smtpErr
      );
    }
  }

  // 2. Fallback 至 Resend SDK
  if (resend && process.env.RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
      });
      console.log(`[Email] Successfully sent email to ${to} via Resend fallback`);
      return { success: true, provider: "resend" };
    } catch (resendErr) {
      console.error(`[Email] Resend fallback also failed:`, resendErr);
      return { success: false, provider: "none", error: resendErr };
    }
  }

  console.warn(`[Email] No active email provider configured (SMTP/Resend). Email skipped for ${to}`);
  return { success: false, provider: "none", error: "No email provider configured" };
}

export async function sendApprovalEmail(to: string, name: string) {
  const siteUrl = process.env.NEXTAUTH_URL || "https://your-domain.com";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const subject = `🎉 ${appName} 邀請審核通過通知`;
  const html = `
    <div style="background-color: #0a0a0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">${appName}</h1>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">私人影片分享空間</p>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 28px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">哈囉，${name}！</h2>
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          你在 ${appName} 的存取申請已經由管理員審核通過囉！
        </p>
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
          現在你可以直接透過你的 Google 帳號登入，開始觀看專屬分組的影片動態。
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${siteUrl}/feed" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; padding: 14px 32px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);">
          立即進入 ${appName}
        </a>
      </div>

      <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
        <p style="color: #71717a; font-size: 12px; margin: 0;">
          此郵件由 ${appName} 系統自動發送，請勿直接回覆。
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendRejectionEmail(to: string, name: string) {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const subject = `${appName} 存取申請結果通知`;
  const html = `
    <div style="background-color: #0a0a0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">${appName}</h1>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">${name} 你好：</h2>
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          感謝你對 ${appName} 的關注。目前暫時無法核准你的存取申請，如有任何疑問，請直接與管理員聯繫確認。
        </p>
      </div>

      <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 28px;">
        <p style="color: #71717a; font-size: 12px; margin: 0;">
          此郵件由 ${appName} 系統自動發送。
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

export async function sendWelcomeAutoApproveEmail(
  to: string,
  name: string,
  groupNames: string[] = []
) {
  const siteUrl = process.env.NEXTAUTH_URL || "https://your-domain.com";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const subject = `🎬 歡迎加入 ${appName}！專屬分組已為您開通`;

  const groupsListHtml =
    groupNames.length > 0
      ? `<div style="margin: 16px 0; padding: 12px 16px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px;">
          <p style="margin: 0 0 6px 0; color: #fbbf24; font-size: 13px; font-weight: 600;">已開通專屬分組：</p>
          <ul style="margin: 0; padding-left: 20px; color: #f4f4f5; font-size: 14px; line-height: 1.5;">
            ${groupNames.map((g) => `<li><strong>${g}</strong></li>`).join("")}
          </ul>
        </div>`
      : "";

  const html = `
    <div style="background-color: #0a0a0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">${appName}</h1>
        <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">私人影片分享空間</p>
      </div>

      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; margin-bottom: 28px;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0;">哈囉，${name}！</h2>
        <p style="color: #d4d4d8; font-size: 15px; line-height: 1.6;">
          歡迎加入 ${appName}！您使用的通行邀請碼已自動為您開通專屬存取權限。
        </p>
        ${groupsListHtml}
        <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
          現在您可以立即進入影片動態牆，開始暢享高畫質影音內容！
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <a href="${siteUrl}/feed" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; padding: 14px 32px; border-radius: 10px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);">
          立即進入 ${appName} 動態牆
        </a>
      </div>

      <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
        <p style="color: #71717a; font-size: 12px; margin: 0;">
          此郵件由 ${appName} 系統自動發送，請勿直接回覆。
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, html });
}

export function maskSecret(secret?: string, prefixLen = 4, suffixLen = 0): string {
  if (!secret) return "未設定";
  if (secret.length <= prefixLen + suffixLen) {
    return "••••••••";
  }
  const prefix = secret.slice(0, prefixLen);
  const suffix = suffixLen > 0 ? secret.slice(-suffixLen) : "";
  return `${prefix}${"•".repeat(Math.max(8, secret.length - prefixLen - suffixLen))}${suffix}`;
}

export function getEmailConfigStatus() {
  const smtpUser = process.env.SMTP_USER || "";
  const smtpPass = process.env.SMTP_PASS || "";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const emailFrom = process.env.EMAIL_FROM || "VideoHub <noreply@your-domain.com>";
  const resendApiKey = process.env.RESEND_API_KEY || "";
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return {
    smtp: {
      configured: Boolean(smtpUser && smtpPass),
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser || "未設定",
      passMasked: smtpPass ? maskSecret(smtpPass, 4, 2) : "未設定",
      from: emailFrom,
    },
    resend: {
      configured: Boolean(resendApiKey),
      apiKeyMasked: resendApiKey ? maskSecret(resendApiKey, 5, 2) : "未設定",
      from: emailFrom,
    },
    adminEmails,
  };
}

export async function sendSingleProviderTestEmail({
  provider,
  to,
}: {
  provider: "smtp" | "resend";
  to: string;
}): Promise<{ success: boolean; message: string; details?: any }> {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const timestamp = new Date().toLocaleString("zh-TW", {
    timeZone: "Asia/Taipei",
    hour12: false,
  });
  const fromAddress =
    process.env.EMAIL_FROM || `${appName} <noreply@your-domain.com>`;

  if (provider === "smtp") {
    const transporter = createSmtpTransporter();
    if (!transporter) {
      return {
        success: false,
        message: "Google SMTP 尚未完成配置 (缺少 SMTP_USER 或 SMTP_PASS)",
      };
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = process.env.SMTP_PORT || "465";
    const user = process.env.SMTP_USER || "";

    const subject = `【系統測試】${appName} — Google SMTP 郵件發送測試成功 ✅`;
    const html = `
      <div style="background-color: #0a0a0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">${appName}</h1>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Google SMTP 連線與驗證診斷</p>
        </div>

        <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #10b981; font-size: 16px; margin: 0 0 8px 0;">🎉 Google Gmail SMTP 連線發送成功！</h2>
          <p style="color: #d1fae5; font-size: 14px; margin: 0; line-height: 1.5;">
            您的 Google 應用程式密碼與 SMTP 伺服器配置完全正常，系統已能穩定發送會員通知與審核信件。
          </p>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #ffffff; font-size: 14px; margin-top: 0; margin-bottom: 12px;">📊 發送參數診斷資訊</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #d4d4d8;">
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; width: 35%;">發送管道</td>
              <td style="padding: 6px 0; font-weight: 600; color: #f59e0b;">Google Gmail SMTP (Nodemailer)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">SMTP 主機</td>
              <td style="padding: 6px 0; font-family: monospace;">${host}:${port} (SSL/TLS)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">發信帳號</td>
              <td style="padding: 6px 0; font-family: monospace;">${user}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">發送時間</td>
              <td style="padding: 6px 0; font-family: monospace;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">目標收件人</td>
              <td style="padding: 6px 0; font-family: monospace; color: #38bdf8;">${to}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            此郵件為 ${appName} 管理後台觸發之連線診斷測試信，無需回覆。
          </p>
        </div>
      </div>
    `;

    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
      });
      return {
        success: true,
        message: `Google SMTP 測試信已成功送達 ${to}`,
        details: { messageId: info.messageId, response: info.response },
      };
    } catch (err: any) {
      console.error("[Email Test] SMTP send failed:", err);
      return {
        success: false,
        message: `Google SMTP 發送失敗: ${err.message || String(err)}`,
        details: err,
      };
    }
  }

  if (provider === "resend") {
    if (!resend || !process.env.RESEND_API_KEY) {
      return {
        success: false,
        message: "Resend 尚未配置 (缺少 RESEND_API_KEY)",
      };
    }

    const keyMasked = maskSecret(process.env.RESEND_API_KEY, 5, 2);
    const subject = `【系統測試】${appName} — Resend API 郵件發送測試成功 🚀`;
    const html = `
      <div style="background-color: #0a0a0f; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px 20px; max-width: 560px; margin: 0 auto; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: -0.5px;">${appName}</h1>
          <p style="color: #a1a1aa; font-size: 13px; margin-top: 4px;">Resend REST API 連線與金鑰診斷</p>
        </div>

        <div style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h2 style="color: #38bdf8; font-size: 16px; margin: 0 0 8px 0;">🚀 Resend API 備用通道測試成功！</h2>
          <p style="color: #e0f2fe; font-size: 14px; margin: 0; line-height: 1.5;">
            您的 Resend API Key 配置有效，若 SMTP 服務發生偶發性中斷時，系統將自動無縫 Fallback 至此通道。
          </p>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <h3 style="color: #ffffff; font-size: 14px; margin-top: 0; margin-bottom: 12px;">📊 發送參數診斷資訊</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #d4d4d8;">
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa; width: 35%;">發送管道</td>
              <td style="padding: 6px 0; font-weight: 600; color: #38bdf8;">Resend REST API (SDK)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">API 金鑰</td>
              <td style="padding: 6px 0; font-family: monospace;">${keyMasked}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">發信位址</td>
              <td style="padding: 6px 0; font-family: monospace;">${fromAddress}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">發送時間</td>
              <td style="padding: 6px 0; font-family: monospace;">${timestamp}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #a1a1aa;">目標收件人</td>
              <td style="padding: 6px 0; font-family: monospace; color: #f59e0b;">${to}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px;">
          <p style="color: #71717a; font-size: 12px; margin: 0;">
            此郵件為 ${appName} 管理後台觸發之 Resend 診斷測試信，無需回覆。
          </p>
        </div>
      </div>
    `;

    try {
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to,
        subject,
        html,
      });

      if (error) {
        return {
          success: false,
          message: `Resend 發送失敗: ${error.message}`,
          details: error,
        };
      }

      return {
        success: true,
        message: `Resend 測試信已成功送達 ${to}`,
        details: data,
      };
    } catch (err: any) {
      console.error("[Email Test] Resend send failed:", err);
      return {
        success: false,
        message: `Resend 發送異常: ${err.message || String(err)}`,
        details: err,
      };
    }
  }

  return {
    success: false,
    message: "無效的郵件發送管道 (僅支援 smtp 或 resend)",
  };
}
