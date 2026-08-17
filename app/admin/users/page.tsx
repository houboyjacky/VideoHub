"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  status: string;
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

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [assignedGroupIds, setAssignedGroupIds] = useState<string[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleApprove = async (userId: string, groupIdsToAssign?: string[]) => {
    try {
      setProcessingId(userId);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: groupIdsToAssign || [] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "審核通過失敗");

      setSuccess("已核准該用戶申請並發送通知信！");
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("確定要拒絕此用戶的申請嗎？系統將發送拒絕通知信。")) {
      return;
    }

    try {
      setProcessingId(userId);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/users/${userId}/reject`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失敗");

      setSuccess("已拒絕該用戶申請。");
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveGroups = async (userId: string) => {
    try {
      setProcessingId(userId);
      setError(null);

      const res = await fetch(`/api/admin/users/${userId}/groups`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupIds: assignedGroupIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新分組失敗");

      setSuccess("已成功更新用戶分組權限！");
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (activeTab === "all") return true;
    if (activeTab === "admin") return u.isAdmin;
    return u.status === activeTab;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const adminCount = users.filter((u) => u.isAdmin).length;

  return (
    <div className="space-y-8">
      {/* 訊息提示 */}
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

      {/* 狀態過濾 Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
        {[
          { key: "all", label: `全部用戶 (${users.length})` },
          {
            key: "pending",
            label: `待審核 (${pendingCount})`,
            highlight: pendingCount > 0,
          },
          {
            key: "approved",
            label: `已核准 (${users.filter((u) => u.status === "approved" && !u.isAdmin).length})`,
          },
          {
            key: "admin",
            label: `👑 系統管理員 (${adminCount})`,
          },
          {
            key: "rejected",
            label: `已拒絕 (${users.filter((u) => u.status === "rejected").length})`,
          },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/5"
            } ${tab.highlight ? "ring-2 ring-amber-500/50" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 用戶列表卡片 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">用戶審核名冊</h2>
          </div>
          <span className="text-xs text-zinc-400">
            顯示 {filteredUsers.length} 位用戶
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            沒有符合目前條件的用戶記錄。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-xs text-zinc-400 uppercase border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3.5 px-4">用戶資訊</th>
                  <th className="py-3.5 px-4">所屬分組</th>
                  <th className="py-3.5 px-4">狀態</th>
                  <th className="py-3.5 px-4">註冊/建立日期</th>
                  <th className="py-3.5 px-4 text-right">審核與操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{u.name}</span>
                        {u.isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            管理員
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isAdmin ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium">
                          全局全頻道存取權 (Root)
                        </span>
                      ) : u.groupNames && u.groupNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.groupNames.map((gn) => (
                            <span
                              key={gn}
                              className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]"
                            >
                              {gn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-xs">未分配分組</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-purple-500/15 text-purple-200 border border-purple-500/40 font-semibold">
                          <ShieldCheck className="w-3 h-3 text-purple-400" />
                          <span>系統管理員</span>
                        </span>
                      ) : u.status === "approved" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" />
                          <span>已核准</span>
                        </span>
                      ) : u.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-red-500/10 text-red-400 border border-red-500/30">
                          <XCircle className="w-3 h-3" />
                          <span>已拒絕</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>待審核</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 font-mono text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-TW") : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        {u.isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-500 px-2.5 py-1 bg-white/[0.02] rounded-lg border border-white/5">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            <span>最高權限（不可變更）</span>
                          </span>
                        ) : u.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setAssignedGroupIds(u.groupIds || []);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-semibold glass-btn-primary cursor-pointer"
                            >
                              核准並分配
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(u.id)}
                              disabled={processingId === u.id}
                              className="px-3 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 cursor-pointer"
                            >
                              拒絕
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setAssignedGroupIds(u.groupIds || []);
                            }}
                            className="px-3 py-1 rounded-lg text-xs font-medium glass-btn hover:border-amber-500/40 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Layers className="w-3 h-3 text-amber-400" />
                            <span>調整分組</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 分組分配與審核彈出視窗 Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-lg p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  {selectedUser.status === "pending" ? "核准並設定用戶權限" : "調整用戶分組權限"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
              <div className="text-zinc-400">
                審核對象：<span className="text-white font-semibold">{selectedUser.name}</span>
              </div>
              <div className="text-zinc-400 font-mono">
                Email：<span className="text-zinc-300">{selectedUser.email}</span>
              </div>
            </div>

            {/* 群組勾選清單 */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-zinc-300">
                可觀看之授權群組（多選）
              </label>

              {groups.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  目前尚未建立任何自訂群組。請先至「分組管理」新增群組，或直接核准（用戶將只能看到公開影片）。
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {groups.map((g) => {
                    const isChecked = assignedGroupIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-amber-500/10 border-amber-500/40 text-white"
                            : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignedGroupIds([...assignedGroupIds, g.id]);
                            } else {
                              setAssignedGroupIds(assignedGroupIds.filter((id) => id !== g.id));
                            }
                          }}
                        />
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? "bg-amber-500 border-amber-500 text-black"
                              : "border-white/20 bg-black/40"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium truncate">{g.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal 操作按鈕 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white"
              >
                取消
              </button>

              {selectedUser.status === "pending" ? (
                <button
                  type="button"
                  onClick={() => handleApprove(selectedUser.id, assignedGroupIds)}
                  disabled={processingId === selectedUser.id}
                  className="px-5 py-2 rounded-xl text-xs font-semibold glass-btn-primary flex items-center gap-1.5"
                >
                  {processingId === selectedUser.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>確認核准並發送信件</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSaveGroups(selectedUser.id)}
                  disabled={processingId === selectedUser.id}
                  className="px-5 py-2 rounded-xl text-xs font-semibold glass-btn-primary flex items-center gap-1.5"
                >
                  {processingId === selectedUser.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>儲存群組設定</span>
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
