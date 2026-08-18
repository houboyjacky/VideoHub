"use client";

import React, { useState, useEffect } from "react";
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

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2000);
    } else {
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const toggleGroupSelection = (gid: string) => {
    setTargetGroupIds((prev) =>
      prev.includes(gid) ? prev.filter((id) => id !== gid) : [...prev, gid]
    );
  };

  // 生成推廣網址
  const getShareUrl = (item: InviteCodeData) => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const shareId = item.targetGroupShareIds?.[0] || item.targetGroupIds?.[0] || "general";
    return `${origin}/share/group/${shareId}?code=${item.code}`;
  };

  const getShareText = (item: InviteCodeData) => {
    const groupName = item.targetGroupNames?.[0] || "專屬影音分組";
    const url = getShareUrl(item);
    return `🎬 【${groupName}】專屬影音內容已開放！\n使用邀請碼【${item.code}】即可立即解鎖完整影片：\n👉 ${url}`;
  };

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

      {/* 建立智慧邀請碼表單 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-white">建立新智慧邀請碼</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                自訂代碼 (選填，留空自動生成)
              </label>
              <input
                type="text"
                placeholder="例如：VIP-FRIENDS"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm uppercase font-mono"
                disabled={creating}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                可用次數上限
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                required
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                disabled={creating}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                有效天數 (預設 30 天)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                required
                value={daysValid}
                onChange={(e) => setDaysValid(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
                disabled={creating}
              />
            </div>
          </div>

          {/* 描述用途 */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              用途備註 (選填，例如：LINE 群推廣、家人專屬)
            </label>
            <input
              type="text"
              placeholder="請輸入此邀請碼的用途或對象備註"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm"
              disabled={creating}
            />
          </div>

          {/* 自動核准 Switch 與綁定分組 */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${autoApprove ? "text-amber-400" : "text-zinc-500"}`} />
                <div>
                  <span className="text-sm font-semibold text-white">⚡ 自動核准免審核 (Auto-Approve)</span>
                  <p className="text-xs text-zinc-400">啟用後，訪客持此碼登入填名即可秒速通過，並自動綁定下方勾選的分組</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoApprove(!autoApprove)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoApprove ? "bg-amber-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    autoApprove ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            {/* 目標分組選擇 */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                目標自動綁定分組（可多選）
              </label>
              {groups.length === 0 ? (
                <p className="text-xs text-zinc-500">目前尚無分組，請先至「分組管理」建立分組。</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const isSelected = targetGroupIds.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroupSelection(g.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <Layers className="w-3 h-3" />
                        <span>{g.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={creating}
              className="px-6 py-2.5 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>建立中...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>建立邀請碼</span>
                </>
              )}
            </button>
          </div>
        </form>
      </GlassCard>

      {/* 邀請碼列表 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-pink-400" />
            <h2 className="text-base font-semibold text-white">智慧邀請碼清單</h2>
          </div>
          <span className="text-xs text-zinc-400">共 {inviteCodes.length} 組</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : inviteCodes.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 text-sm">
            尚未建立任何邀請碼，請使用上方表單建立。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-xs text-zinc-400 uppercase border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3.5 px-4">邀請代碼 / 備註</th>
                  <th className="py-3.5 px-4">類型 / 目標分組</th>
                  <th className="py-3.5 px-4">使用狀況</th>
                  <th className="py-3.5 px-4">有效期限</th>
                  <th className="py-3.5 px-4">狀態</th>
                  <th className="py-3.5 px-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {inviteCodes.map((item) => {
                  const isExpired = new Date(item.expiresAt) < new Date();
                  const isFull = item.usedCount >= item.maxUses;
                  const isActive = !item.disabled && !isExpired && !isFull;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-amber-300">{item.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.code, "code")}
                            className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                            title="複製邀請碼"
                          >
                            {copiedCode === item.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">{item.description}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {item.autoApprove ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                              <Zap className="w-3 h-3" />
                              <span>自動核准</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-400 border border-zinc-700">
                              <span>手動審核</span>
                            </span>
                          )}
                          {item.targetGroupNames && item.targetGroupNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.targetGroupNames.map((gn, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-white/5 text-zinc-300 border border-white/10"
                                >
                                  {gn}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-zinc-200 font-semibold">{item.usedCount}</span>
                        <span className="text-zinc-500"> / {item.maxUses}</span>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-400">
                        <span className="flex items-center gap-1.5 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{new Date(item.expiresAt).toLocaleDateString("zh-TW")}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {item.disabled ? (
                          <span className="px-2 py-0.5 rounded text-[11px] bg-zinc-800 text-zinc-400 border border-zinc-700">
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
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setShareModalItem(item)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors inline-flex items-center gap-1"
                          title="生成推廣短文與連結"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>推廣</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(item.id, item.disabled)}
                          disabled={togglingId === item.id}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
                            item.disabled
                              ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{item.disabled ? "啟用" : "停用"}</span>
                        </button>
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
      {shareModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <GlassCard className="p-6 sm:p-8 border border-white/15 shadow-2xl space-y-6 bg-zinc-950/95 rounded-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3 text-amber-400">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
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
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* 邀請碼資訊 (高亮大卡片) */}
                <div className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs sm:text-sm text-zinc-400 block mb-0.5">專屬通行邀請碼</span>
                    <div className="font-mono font-black text-amber-300 text-2xl tracking-wider">
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
        </div>
      )}
    </div>
  );
}
