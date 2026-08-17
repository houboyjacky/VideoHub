"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Layers, Plus, Trash2, Loader2, Video, Users, AlertCircle, CheckCircle2 } from "lucide-react";

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

  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
    </div>
  );
}
