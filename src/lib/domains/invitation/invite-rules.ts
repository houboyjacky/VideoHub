export interface InviteCodeEntity {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date;
  disabled?: boolean;
  autoApprove?: boolean;
  targetGroupIds?: string[];
  description?: string | null;
}

export type InviteValidateStatus = 
  | "VALID"
  | "NOT_FOUND"
  | "DISABLED"
  | "EXPIRED"
  | "MAX_USES_REACHED";

export interface ValidateInviteResult {
  status: InviteValidateStatus;
  isValid: boolean;
  errorMessage?: string;
}

/**
 * 領域規則：校驗邀請碼有效性
 */
export function validateInviteCodeRules(invite: InviteCodeEntity | null | undefined): ValidateInviteResult {
  if (!invite) {
    return {
      status: "NOT_FOUND",
      isValid: false,
      errorMessage: "邀請碼無效或不存在",
    };
  }

  if (invite.disabled) {
    return {
      status: "DISABLED",
      isValid: false,
      errorMessage: "此邀請碼已被停用",
    };
  }

  const now = new Date();
  if (invite.expiresAt && new Date(invite.expiresAt) < now) {
    return {
      status: "EXPIRED",
      isValid: false,
      errorMessage: "此邀請碼已過期",
    };
  }

  if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
    return {
      status: "MAX_USES_REACHED",
      isValid: false,
      errorMessage: "此邀請碼已達使用次數上限",
    };
  }

  return {
    status: "VALID",
    isValid: true,
  };
}

/**
 * 領域規則：邀請碼安全刪除檢查（必須為已停用狀態）
 */
export function canDeleteInviteCode(invite: InviteCodeEntity | null | undefined): boolean {
  if (!invite) return false;
  return Boolean(invite.disabled);
}
