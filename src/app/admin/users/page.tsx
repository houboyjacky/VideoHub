"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Layers,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Search,
  KeyRound,
  Edit2,
  Trash2,
  Power,
  X,
  Plus,
  Copy,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  status: string;
  disabled?: boolean;
  usedInviteCode?: string | null;
  lastLoginAt?: string | null;
  groupIds: string[];
  groupNames: string[];
  createdAt: string;
  approvedAt: string | null;
  isAdmin?: boolean;
}

interface GroupItem {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 分組指派彈窗狀態
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 改名彈窗狀態
  const [renamingUser, setRenamingUser] = useState<UserItem | null>(null);
  const [newName, setNewName] = useState("");
  const [savingRename, setSavingRename] = useState(false);

  // 刪除確認彈窗狀態
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 複製提示
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "無法載入用戶清單");
      setUsers(data.users || []);
      setGroups(data.groups || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 篩選與搜尋
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab 篩選
      if (activeTab === "pending" && u.status !== "pending") return false;
      if (activeTab === "approved" && u.status !== "approved") return false;
      if (activeTab === "disabled" && !u.disabled) return false;

      // 搜尋關鍵字
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchCode = u.usedInviteCode?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCode) return false;
      }

      return true;
    });
  }, [users, activeTab, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // 審核核准
  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      setError(null);
      const res = await fetch(`/api/admin/users/${id}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "審核失敗");
      setSuccess("已核准該用戶申請");
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 審核拒絕
  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      setError(null);
      const res = await fetch(`/api/admin/users/${id}/reject`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失敗");
      setSuccess("已拒絕該用戶申請");
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 停用 / 啟用切換
  const handleToggleDisabled = async (user: UserItem) => {
    try {
      setProcessingId(user.id);
      setError(null);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !user.disabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "切換狀態失敗");

      setSuccess(`已成功${user.disabled ? "啟用" : "停用"}用戶「${user.name}」`);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 開啟改名彈窗
  const handleOpenRename = (user: UserItem) => {
    setRenamingUser(user);
    setNewName(user.name);
  };

  // 儲存改名
  const handleSaveRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingUser || !newName.trim()) return;

    try {
      setSavingRename(true);
      setError(null);
      const res = await fetch(`/api/admin/users/${renamingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "改名失敗");

      setSuccess(`已成功將用戶姓名更新為「${newName.trim()}」`);
      setRenamingUser(null);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSavingRename(false);
    }
  };

  // 刪除用戶
  const handleExecuteDelete = async () => {
    if (!deletingUser || !deleteConfirmed) return;

    try {
      setIsDeleting(true);
      setError(null);
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");

      setSuccess(`已永久刪除用戶「${deletingUser.name}」`);
      setDeletingUser(null);
      setDeleteConfirmed(false);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // 直接新增分組
  const handleAddGroupDirect = async (user: UserItem, groupId: string) => {
    if (!groupId) return;
    const nextGroupIds = Array.from(new Set([...(user.groupIds || []), groupId]));

    try {
      setProcessingId(user.id);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: nextGroupIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "新增分組失敗");
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  // 直接移除分組
  const handleRemoveGroupDirect = async (user: UserItem, groupId: string) => {
    const nextGroupIds = (user.groupIds || []).filter((id) => id !== groupId);

    try {
      setProcessingId(user.id);
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: nextGroupIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "移除分組失敗");
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* 提示訊息 */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 搜尋與篩選列 */}
      <GlassCard className="p-4 sm:p-6 border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* 搜尋框 */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜尋姓名、Email、邀請碼..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs sm:text-sm text-zinc-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 分頁 Tab */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "all"
                  ? "bg-amber-500 text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              全部 ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "pending"
                  ? "bg-amber-500 text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              待審核 ({users.filter((u) => u.status === "pending").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "approved"
                  ? "bg-amber-500 text-black font-bold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              已核准 ({users.filter((u) => u.status === "approved").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("disabled")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "disabled"
                  ? "bg-red-500 text-white font-bold shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              已停用 ({users.filter((u) => u.disabled).length})
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 用戶列表 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-semibold text-white">人員管理列表</h2>
          </div>
          <span className="text-xs text-zinc-400">共 {filteredUsers.length} 位成員</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            {searchQuery ? "找不到符合搜尋條件的用戶。" : "目前尚無任何用戶記錄。"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-xs text-zinc-400 uppercase border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3.5 px-4">用戶資訊</th>
                  <th className="py-3.5 px-4">邀請來源 / 狀態</th>
                  <th className="py-3.5 px-4">已授權分組</th>
                  <th className="py-3.5 px-4">時間記錄</th>
                  <th className="py-3.5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* 用戶姓名與 Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{user.name}</span>
                        {user.isAdmin && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            管理員
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenRename(user)}
                          className="p-1 rounded text-zinc-400 hover:text-amber-300 hover:bg-white/10"
                          title="修改稱呼"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-xs text-zinc-400 font-mono">{user.email}</div>
                    </td>

                    {/* 邀請碼來源與狀態 */}
                    <td className="py-3.5 px-4 space-y-1">
                      {user.usedInviteCode ? (
                        <div className="flex items-center gap-1.5 font-mono text-xs text-amber-300/90">
                          <KeyRound className="w-3 h-3 text-amber-400" />
                          <span>{user.usedInviteCode}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(user.usedInviteCode!)}
                            className="p-0.5 text-zinc-500 hover:text-white"
                            title="複製邀請碼"
                          >
                            {copiedCode === user.usedInviteCode ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-zinc-500">無邀請碼記錄</span>
                      )}

                      <div>
                        {user.disabled ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 font-semibold">
                            已停用
                          </span>
                        ) : user.status === "approved" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            已核准
                          </span>
                        ) : user.status === "pending" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            待審核
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                            {user.status}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 分組標籤與直接增刪 */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1 max-w-xs">
                        {user.groupNames && user.groupNames.length > 0 ? (
                          user.groupIds.map((gid, idx) => {
                            const gname = user.groupNames[idx] || "未知分組";
                            return (
                              <span
                                key={gid}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-white/5 text-zinc-300 border border-white/10"
                              >
                                <span>{gname}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGroupDirect(user, gid)}
                                  className="text-zinc-500 hover:text-red-400 cursor-pointer"
                                  title="移除此分組"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-zinc-500">未指派分組</span>
                        )}

                        {/* 新增分組下拉 */}
                        <select
                          value=""
                          onChange={(e) => handleAddGroupDirect(user, e.target.value)}
                          className="px-1.5 py-0.5 rounded text-[11px] bg-white/5 border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
                        >
                          <option value="">+ 加分組</option>
                          {groups
                            .filter((g) => !user.groupIds?.includes(g.id))
                            .map((g) => (
                              <option key={g.id} value={g.id} className="bg-zinc-900 text-white">
                                {g.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </td>

                    {/* 時間記錄 */}
                    <td className="py-3.5 px-4 text-zinc-400 text-xs font-mono">
                      <div>加入：{new Date(user.createdAt).toLocaleDateString("zh-TW")}</div>
                      {user.lastLoginAt && (
                        <div className="text-[11px] text-zinc-500">
                          活躍：{new Date(user.lastLoginAt).toLocaleDateString("zh-TW")}
                        </div>
                      )}
                    </td>

                    {/* 操作按鈕 */}
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {user.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(user.id)}
                            disabled={processingId === user.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                          >
                            核准
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(user.id)}
                            disabled={processingId === user.id}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30"
                          >
                            拒絕
                          </button>
                        </>
                      )}

                      {/* 停用 / 啟用按鈕 */}
                      {!user.isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleToggleDisabled(user)}
                          disabled={processingId === user.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 cursor-pointer ${
                            user.disabled
                              ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border-emerald-500/30"
                              : "bg-zinc-800 text-zinc-400 hover:text-amber-300 hover:bg-zinc-700 border-zinc-700"
                          }`}
                          title={user.disabled ? "啟用此帳號" : "停用此帳號"}
                        >
                          <Power className="w-3 h-3" />
                          <span>{user.disabled ? "啟用" : "停用"}</span>
                        </button>
                      )}

                      {/* 刪除按鈕 */}
                      {!user.isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingUser(user);
                            setDeleteConfirmed(false);
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center"
                          title="永久刪除用戶"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 改名彈窗 Modal */}
      {renamingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 bg-zinc-950/90">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Edit2 className="w-4 h-4" />
                <h3 className="text-base font-bold text-white">修改用戶稱呼</h3>
              </div>
              <button
                type="button"
                onClick={() => setRenamingUser(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRename} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">姓名或稱呼</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-white"
                  disabled={savingRename}
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setRenamingUser(null)}
                  className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingRename || !newName.trim()}
                  className="px-5 py-2 rounded-xl glass-btn-primary flex items-center gap-1.5 text-xs font-bold disabled:opacity-50"
                >
                  {savingRename ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>儲存中...</span>
                    </>
                  ) : (
                    <span>儲存名稱</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 刪除確認彈窗 Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-red-500/20 shadow-2xl space-y-4 bg-zinc-950/95">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-red-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">確認永久刪除用戶</h3>
              </div>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <p>
                您確定要永久刪除用戶 <strong className="text-white">{deletingUser.name}</strong> (
                {deletingUser.email}) 嗎？
              </p>
              <p className="text-red-400/90 text-xs">
                ⚠️ 此操作將永久抹除該帳號的審核記錄、分組權限與登入憑證，且無法復原。
              </p>

              <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={deleteConfirmed}
                  onChange={(e) => setDeleteConfirmed(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-red-500 focus:ring-red-500"
                />
                <span className="text-xs text-zinc-300">我已理解此操作不可逆，確認永久刪除</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-400 hover:text-white"
              >
                取消
              </button>
              <button
                type="button"
                disabled={!deleteConfirmed || isDeleting}
                onClick={handleExecuteDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>刪除中...</span>
                  </>
                ) : (
                  <span>確認刪除</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
