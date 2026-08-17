"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  Video,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Check,
} from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  description: string | null;
  videoCount: number;
  userCount: number;
  createdAt: string;
}

export default function AdminGroupsPage() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 新增分組狀態
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 編輯分組狀態
  const [editingGroup, setEditingGroup] = useState<GroupData | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/groups");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "無法載入分組清單");
      setGroups(data.groups || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "建立分組失敗");

      setSuccess(`成功建立分組「${newName}」！`);
      setNewName("");
      setNewDesc("");
      fetchGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (group: GroupData) => {
    setEditingGroup(group);
    setEditName(group.name);
    setEditDesc(group.description || "");
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGroup || !editName.trim()) return;

    try {
      setSavingEdit(true);
      setError(null);
      setSuccess(null);

      const res = await fetch(`/api/admin/groups/${editingGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新分組失敗");

      setSuccess(`已成功更新分組「${editName}」！`);
      setEditingGroup(null);
      fetchGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`確定要刪除分組「${name}」嗎？\n關聯的影片和用戶將會自動解除此分組關聯。`)) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);
      const res = await fetch(`/api/admin/groups/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");

      setSuccess(`已成功刪除分組「${name}」`);
      fetchGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setDeletingId(null);
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

      {/* 建立新分組表單 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-white">建立新影片分組</h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              分組名稱 <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如：高中同學、球隊、家庭"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              disabled={creating}
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              備註說明 (選填)
            </label>
            <input
              type="text"
              placeholder="例如：僅供老朋友觀看的聚會紀錄"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              disabled={creating}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="w-full py-2.5 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>建立中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>新增分組</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* 分組清單列表 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">現有分組清單</h2>
          </div>
          <span className="text-xs text-zinc-400">共 {groups.length} 個分組</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : groups.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            目前尚未建立任何分組，請使用上方表單建立第一個分組。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      {group.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(group)}
                        className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="修改分組名稱與說明"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(group.id, group.name)}
                        disabled={deletingId === group.id}
                        className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        title="刪除分組"
                      >
                        {deletingId === group.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  {group.description && (
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-400 pt-3 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5 text-sky-400" />
                    <span>{group.videoCount} 部影片</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{group.userCount} 位成員</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* 編輯分組彈窗 Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">修改分組資訊</h3>
                  <p className="text-xs text-zinc-400">更新分組名稱或備註說明</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingGroup(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  分組名稱 <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="輸入新的分組名稱"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-white"
                  disabled={savingEdit}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  備註說明 (選填)
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="例如：僅供老朋友觀看的聚會紀錄"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-white"
                  disabled={savingEdit}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editName.trim()}
                  className="px-5 py-2 rounded-xl glass-btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>儲存中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>儲存變更</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
