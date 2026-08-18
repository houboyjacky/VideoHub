export interface ValidateProfileResult {
  isValid: boolean;
  name?: string;
  error?: string;
}

/**
 * 領域規則：校驗使用者自訂稱呼
 */
export function validateProfileName(input: unknown): ValidateProfileResult {
  if (typeof input !== "string") {
    return { isValid: false, error: "稱呼格式不正確" };
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, error: "稱呼不可為空" };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: "稱呼長度不可超過 50 個字元" };
  }

  return { isValid: true, name: trimmed };
}
