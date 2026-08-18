export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface SendMailResult {
  success: boolean;
  provider: string;
  error?: unknown;
}

export interface EmailConfigStatus {
  smtp: {
    configured: boolean;
    host: string;
    port: number;
    user: string;
    passMasked: string;
    secure: boolean;
  };
  resend: {
    configured: boolean;
    apiKeyMasked: string;
  };
  fromAddress: string;
}

/**
 * 遮蔽機密字串
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return "未設定";
  if (secret.length <= 4) return "••••";
  const prefix = secret.slice(0, 3);
  const suffix = secret.slice(-2);
  return `${prefix}${"•".repeat(Math.max(4, secret.length - 5))}${suffix}`;
}
