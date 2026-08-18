import { prisma } from "@/lib/prisma";
import { recordActivityLog } from "@/lib/audit-log";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";

export interface ApproveUserInput {
  userId: string;
  adminEmail: string;
  adminName?: string;
  reqHeaders?: Headers | Request | null;
  clientIp?: string;
}

/**
 * Use Case: 管理員通過使用者審核
 */
export async function approveUserUseCase(input: ApproveUserInput) {
  const { userId, adminEmail, adminName = "管理員", reqHeaders, clientIp } = input;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { success: false, statusCode: 404, error: "找不到該使用者" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: "approved" },
  });

  recordActivityLog({
    email: adminEmail,
    name: adminName,
    userId,
    action: "admin_approve_user",
    status: "success",
    details: `管理員審核通過用戶「${targetUser.name || targetUser.email}」(${targetUser.email})`,
    req: reqHeaders,
    ip: clientIp,
  });

  if (targetUser.email) {
    sendApprovalEmail(
      targetUser.email,
      targetUser.name || "會員"
    ).catch((err: any) => {
      console.error("[ApproveUser] Failed to send approval email:", err);
    });
  }

  return { success: true, statusCode: 200, user: updated };
}

export interface RejectUserInput {
  userId: string;
  adminEmail: string;
  adminName?: string;
  reqHeaders?: Headers | Request | null;
  clientIp?: string;
}

/**
 * Use Case: 管理員拒絕使用者審核
 */
export async function rejectUserUseCase(input: RejectUserInput) {
  const { userId, adminEmail, adminName = "管理員", reqHeaders, clientIp } = input;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { success: false, statusCode: 404, error: "找不到該使用者" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: "rejected" },
  });

  recordActivityLog({
    email: adminEmail,
    name: adminName,
    userId,
    action: "admin_reject_user",
    status: "success",
    details: `管理員拒絕用戶「${targetUser.name || targetUser.email}」(${targetUser.email})`,
    req: reqHeaders,
    ip: clientIp,
  });

  if (targetUser.email) {
    sendRejectionEmail(
      targetUser.email,
      targetUser.name || "訪客"
    ).catch((err: any) => {
      console.error("[RejectUser] Failed to send rejection email:", err);
    });
  }

  return { success: true, statusCode: 200, user: updated };
}

export interface UpdateUserGroupsInput {
  userId: string;
  groupIds: string[];
  adminEmail: string;
  adminName?: string;
  reqHeaders?: Headers | Request | null;
  clientIp?: string;
}

/**
 * Use Case: 管理員調整使用者分組
 */
export async function updateUserGroupsUseCase(input: UpdateUserGroupsInput) {
  const { userId, groupIds, adminEmail, adminName = "管理員", reqHeaders, clientIp } = input;

  const targetUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { success: false, statusCode: 404, error: "找不到該使用者" };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { groupIds: { set: groupIds } },
  });

  recordActivityLog({
    email: adminEmail,
    name: adminName,
    userId,
    action: "admin_update_user_groups",
    status: "success",
    details: `管理員將用戶「${targetUser.name || targetUser.email}」的分組調整為 [${groupIds.join(", ")}]`,
    req: reqHeaders,
    ip: clientIp,
  });

  return { success: true, statusCode: 200, user: updated };
}
