import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { validateProfileName } from "@/lib/domains/identity/profile-validator";

export interface UpdateUserProfileInput {
  email: string;
  name: unknown;
  reqHeaders?: Headers | Request | null;
  clientIp?: string;
}

export interface UpdateUserProfileOutput {
  success: boolean;
  statusCode: number;
  message?: string;
  error?: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

/**
 * Application Use Case: 修改使用者個人稱呼
 */
export async function updateUserProfileUseCase(
  input: UpdateUserProfileInput
): Promise<UpdateUserProfileOutput> {
  const { email, name, reqHeaders, clientIp } = input;
  const normalizedEmail = email.toLowerCase().trim();

  // 1. 領域校驗
  const validation = validateProfileName(name);
  if (!validation.isValid || !validation.name) {
    return {
      success: false,
      statusCode: 400,
      error: validation.error || "稱呼無效",
    };
  }

  const cleanName = validation.name;

  // 2. 查詢使用者
  const current = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!current) {
    return {
      success: false,
      statusCode: 404,
      error: "找不到該使用者帳號",
    };
  }

  if (current.disabled) {
    return {
      success: false,
      statusCode: 403,
      error: "您的帳號已被停用，無法修改資料",
    };
  }

  // 3. 更新資料庫
  const updated = await prisma.user.update({
    where: { email: normalizedEmail },
    data: { name: cleanName },
  });

  // 4. 記錄活動日誌
  recordActivityLog({
    email: normalizedEmail,
    name: cleanName,
    image: updated.image,
    userId: updated.id,
    action: "user_update_profile",
    status: "success",
    details: `使用者將稱呼從「${current.name}」修改為「${cleanName}」`,
    req: reqHeaders,
    ip: clientIp,
  });

  return {
    success: true,
    statusCode: 200,
    message: "個人稱呼已成功更新",
    user: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
    },
  };
}
