export type UserStatus = "unregistered" | "pending" | "approved" | "rejected" | "disabled";

export interface UserEntity {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  status: UserStatus;
  groupIds?: string[];
  disabled?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 領域規則：驗證使用者狀態流轉是否合法
 */
export function canTransitionUserStatus(from: UserStatus, to: UserStatus): boolean {
  if (from === to) return true;
  if (to === "disabled") return true; // 任何狀態均可被停用
  
  if (from === "unregistered") {
    return to === "pending" || to === "approved";
  }
  if (from === "pending") {
    return to === "approved" || to === "rejected";
  }
  if (from === "rejected") {
    return to === "pending" || to === "approved";
  }
  if (from === "approved") {
    return to === "pending";
  }
  if (from === "disabled") {
    return to === "approved" || to === "pending";
  }
  return false;
}
