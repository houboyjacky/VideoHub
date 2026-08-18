"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Power,
  Loader2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Zap,
  Share2,
  X,
  Layers,
  Trash2,
  ShieldAlert,
} from "lucide-react";

interface GroupOption {
  id: string;
  name: string;
  shareId?: string | null;
}

interface InviteCodeData {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  disabled: boolean;
  usedBy: string[];
  autoApprove?: boolean;
  targetGroupIds?: string[];
  targetGroupNames?: string[];
  targetGroupShareIds?: string[];
  description?: string | null;
  createdAt: string;
}

export default function AdminInviteCodesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCodeData[]>([]);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form states
  const [customCode, setCustomCode] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [daysValid, setDaysValid] = useState("30");
  const [autoApprove, setAutoApprove] = useState(false);
  const [targetGroupIds, setTargetGroupIds] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  // Share Modal states
  const [shareModalItem, setShareModalItem] = useState<InviteCodeData | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Delete Modal states
  const [deletingCode, setDeletingCode] = useState<InviteCodeData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resCodes, resGroups] = await Promise.all([
        fetch("/api/admin/invite-codes"),
        fetch("/api/admin/groups"),
      ]);

      const dataCodes = await resCodes.json();
      const dataGroups = await resGroups.json();

      if (!resCodes.ok) throw new Error(dataCodes.error || "無法載入邀請碼清單");
      setInviteCodes(dataCodes.inviteCodes || []);
      setGroups(dataGroups.groups || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customCode,
          maxUses,
          daysValid,
          autoApprove,
          targetGroupIds,
          description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "建立邀請碼失敗");

      setSuccess(`成功建立智慧邀請碼：${data.inviteCode.code}`);
      setCustomCode("");
      setDescription("");
      setAutoApprove(false);
      setTargetGroupIds([]);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string, currentDisabled: boolean) => {
    try {
      setTogglingId(id);
      setError(null);

      const res = await fetch(`/api/admin/invite-codes/${id}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失敗");

      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingCode) return;
    try {
      setIsDeleting(true);
      setError(null);

      const res = await fetch(`/api/admin/invite-codes/${deletingCode.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除邀請碼失敗");

      setSuccess(data.message || `已成功刪除邀請碼【${deletingCode.code}】`);
      setDeletingCode(null);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleCopyTableCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleGroupSelection = (groupId: string) => {
    setTargetGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const getShareUrl = (item: InviteCodeData) => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    if (item.targetGroupShareIds && item.targetGroupShareIds.length > 0) {
      return `${origin}/share/group/${item.targetGroupShareIds[0]}?invite=${item.code}`;
    }
    return `${origin}/register?invite=${item.code}`;
  };

  const getShareText = (item: InviteCodeData) => {
    const url = getShareUrl(item);
    const groupText =
      item.targetGroupNames && item.targetGroupNames.length > 0
        ? `【${item.targetGroupNames.join("、")}】`
        : "精選私人影音分組";
    return `🍿 邀請你加入我的私人影音站！\n點擊專屬連結立即開通觀看權限${groupText}：\n${url}\n\n通行邀請碼：${item.code}`;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 標題與說明 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-amber-400" />
            <span>智慧邀請碼管理</span>
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            發行具備次數、效期、自動審核與分組綁定之邀請通行碼
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* 建立新邀請碼表單 */}
      <GlassCard className="p-6 sm:p-7 border border-white/10 shadow-xl space-y-6">
        <div className="flex items-center gap-2.5 text-amber-400 border-b border-white/10 pb-4">
          <Plus className="w-5 h-5" />
          <h2 className="text-lg font-bold text-white">發行新邀請通行碼</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 自訂代碼 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                自訂代碼（留空則由系統隨機產生）
              </label>
              <input
                type="text"
                placeholder="例如：VIP-SUMMER"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono uppercase text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            {/* 可使用次數 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                可使用次數上限
              </label>
              <input
                type="number"
                min="1"
                required
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-zinc-100"
              />
            </div>

            {/* 有效天數 */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-300">
                有效天數
              </label>
              <input
                type="number"
                min="1"
                required
                value={daysValid}
                onChange={(e) => setDaysValid(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-zinc-100"
              />
            </div>
          </div>

          {/* 備註說明 */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-300">
              備註說明（選填，用於紀錄發送對象或活動名稱）
            </label>
            <input
              type="text"
              placeholder="例如：給攝影同好會、2026 夏季活動等"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          {/* 智慧功能設定 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">自動免審開通（Auto-Approve）</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              啟用後，新訪客使用此代碼註冊將直接成為【已核准（Approved）】會員，無需管理員手動至人員管理審核。
            </p>
          </div>

          {/* 綁定分組權限 */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>綁定專屬分組（使用此邀請碼註冊或兌換時自動加入指定群組）</span>
            </label>
            {groups.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">尚無任何分組，可先至分組管理建立</p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {groups.map((group) => {
                  const isSelected = targetGroupIds.includes(group.id);
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => toggleGroupSelection(group.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm"
                          : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span>{group.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 rounded-xl glass-btn-primary flex items-center gap-2 text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>建立中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>發行邀請碼</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* 邀請碼列表 */}
      <GlassCard className="p-6 sm:p-7 border border-white/10 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5 text-zinc-200">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">已發行邀請碼清單</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-zinc-400 font-mono">
              {inviteCodes.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-zinc-400 gap-2 items-center">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span>載入中...</span>
          </div>
        ) : inviteCodes.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            目前尚未發行任何邀請碼
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-300">
              <thead className="text-xs uppercase bg-white/[0.02] text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-4">邀請代碼</th>
                  <th className="py-3 px-4">備註說明</th>
                  <th className="py-3 px-4">自動開通 / 綁定分組</th>
                  <th className="py-3 px-4">使用次數</th>
                  <th className="py-3 px-4">有效期限</th>
                  <th className="py-3 px-4">狀態</th>
                  <th className="py-3 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inviteCodes.map((item) => {
                  const isExpired = new Date(item.expiresAt) < new Date();
                  const isFull = item.usedCount >= item.maxUses;
                  const isCopied = copiedCode === item.code;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        <div className="flex items-center gap-2">
                          <span>{item.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTableCode(item.code)}
                            className="p-1 rounded text-zinc-500 hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
                            title="複製邀請代碼"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400 text-xs max-w-[150px] truncate">
                        {item.description || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex flex-col gap-1 items-start">
                          {item.autoApprove && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                              ⚡ 免審直通
                            </span>
                          )}
                          {item.targetGroupNames && item.targetGroupNames.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {item.targetGroupNames.map((gn, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.2 rounded text-[10px] bg-white/5 text-zinc-300 border border-white/10"
                                >
                                  {gn}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">無指定</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <span
                          className={
                            isFull ? "text-red-400 font-bold" : "text-zinc-300"
                          }
                        >
                          {item.usedCount}
                        </span>
                        <span className="text-zinc-600"> / {item.maxUses}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400 font-mono">
                        {new Date(item.expiresAt).toLocaleDateString("zh-TW")}
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {item.disabled ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-500 border border-zinc-700">
                            已停用
                          </span>
                        ) : isExpired ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-red-500/10 text-red-400 border border-red-500/30">
                            已過期
                          </span>
                        ) : isFull ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            額度已滿
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                            有效中
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setShareModalItem(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="生成推廣短文與連結"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>推廣</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(item.id, item.disabled)}
                          disabled={togglingId === item.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
                            item.disabled
                              ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30"
                          }`}
                          title={item.disabled ? "點擊重新啟用" : "點擊停用此邀請碼"}
                        >
                          <Power className="w-3 h-3" />
                          <span>{item.disabled ? "啟用" : "停用"}</span>
                        </button>

                        {/* 刪除按鈕：必須先停用後方可刪除 */}
                        {item.disabled ? (
                          <button
                            type="button"
                            onClick={() => setDeletingCode(item)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            title="刪除此已停用之邀請碼"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>刪除</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-800/40 text-zinc-600 border border-zinc-700/30 inline-flex items-center gap-1 cursor-not-allowed opacity-50"
                            title="必須先停用後方可刪除"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>刪除</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* 推廣分享彈窗 Modal (寬敞大字級) */}
      {mounted &&
        shareModalItem &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setShareModalItem(null)}
          >
            <div
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 bg-zinc-950/95 rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3 text-amber-400">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                      <Share2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        智慧邀請碼推廣分享
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        一鍵複製帶碼註冊網址與社群推廣文案
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareModalItem(null)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="關閉"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {/* 邀請碼資訊 (高亮大卡片) */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs sm:text-sm text-zinc-400 block mb-0.5">專屬通行邀請碼</span>
                      <div className="font-mono font-black text-amber-300 text-2xl sm:text-3xl tracking-wider">
                        {shareModalItem.code}
                      </div>
                    </div>
                    <div className="sm:text-right space-y-1">
                      <span className="text-xs sm:text-sm text-zinc-400 block">綁定權限與分組</span>
                      <div className="flex flex-wrap sm:justify-end gap-1.5 items-center">
                        {shareModalItem.autoApprove ? (
                          <span className="px-2.5 py-0.5 rounded-md text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                            ⚡ 自動開通
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-md text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
                            手動審核
                          </span>
                        )}
                        {shareModalItem.targetGroupNames && shareModalItem.targetGroupNames.length > 0 ? (
                          shareModalItem.targetGroupNames.map((gn, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 rounded-md text-xs bg-white/10 text-zinc-200 border border-white/15 font-semibold"
                            >
                              {gn}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-zinc-400">（無指定分組）</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 專屬推廣連結 */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-200">
                      專屬分享網址（點擊後自動預填邀請碼）
                    </label>
                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        readOnly
                        value={getShareUrl(shareModalItem)}
                        className="w-full px-4 py-3 rounded-xl glass-input text-sm font-mono text-amber-200 bg-black/50 border border-white/15 selection:bg-amber-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(getShareUrl(shareModalItem), "modal-url")}
                        className="px-5 py-3 rounded-xl glass-btn-primary flex items-center gap-2 text-sm shrink-0 font-bold shadow-lg cursor-pointer"
                      >
                        {copiedType === "modal-url" ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                            <span>已複製</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>複製連結</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 社群推廣短文 */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-200">
                      LINE / 社群推廣短文
                    </label>
                    <textarea
                      rows={4}
                      readOnly
                      value={getShareText(shareModalItem)}
                      className="w-full p-4 rounded-xl glass-input text-sm text-zinc-200 bg-black/50 border border-white/15 resize-none font-sans leading-relaxed selection:bg-amber-500/30"
                    />
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(getShareText(shareModalItem), "modal-text")}
                        className="px-5 py-2.5 rounded-xl glass-btn flex items-center gap-2 text-sm font-semibold text-amber-300 hover:text-white border-amber-500/40 hover:bg-amber-500/10 transition-colors shadow-md cursor-pointer"
                      >
                        {copiedType === "modal-text" ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-300 stroke-[2.5]" />
                            <span>已複製短文</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>複製推廣短文</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>,
          document.body
        )}

      {/* 刪除確認 Modal */}
      {mounted &&
        deletingCode &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setDeletingCode(null)}
          >
            <div
              className="w-full max-w-md relative"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard className="p-6 sm:p-7 border border-red-500/30 shadow-2xl space-y-6 bg-zinc-950/95 rounded-2xl">
                <div className="flex items-center gap-3.5 text-red-400 border-b border-white/10 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/10">
                    <ShieldAlert className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      確認刪除邀請碼？
                    </h3>
                    <p className="text-xs text-zinc-400">
                      此操作將永久移除此邀請碼紀錄
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    您確定要物理刪除已停用的邀請碼{" "}
                    <span className="font-mono font-bold text-amber-300 bg-black/50 px-2 py-0.5 rounded border border-white/10">
                      {deletingCode.code}
                    </span>{" "}
                    嗎？
                  </p>
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 leading-relaxed space-y-1">
                    <p className="font-semibold">⚠️ 注意事項：</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-zinc-400">
                      <li>刪除後該代碼將無法再次被兌換或恢復。</li>
                      <li>過去已透過此代碼註冊或兌換的會員帳號權限不受影響。</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeletingCode(null)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 rounded-xl glass-btn text-xs sm:text-sm font-medium text-zinc-300 hover:text-white cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>刪除中...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>確認刪除</span>
                      </>
                    )}
                  </button>
                </div>
              </GlassCard>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
