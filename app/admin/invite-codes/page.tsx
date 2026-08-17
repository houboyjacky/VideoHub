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
} from "lucide-react";

interface InviteCodeData {
  id: string;
  code: string;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  disabled: boolean;
  usedBy: string[];
  createdAt: string;
}

export default function AdminInviteCodesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [customCode, setCustomCode] = useState("");
  const [maxUses, setMaxUses] = useState("1");
  const [daysValid, setDaysValid] = useState("30");

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInviteCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/invite-codes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "無法載入邀請碼清單");
      setInviteCodes(data.inviteCodes || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInviteCodes();
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
        body: JSON.stringify({ customCode, maxUses, daysValid }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "建立邀請碼失敗");

      setSuccess(`成功建立邀請碼：${data.inviteCode.code}`);
      setCustomCode("");
      fetchInviteCodes();
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

      fetchInviteCodes();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
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

      {/* 建立邀請碼表單 */}
      <GlassCard className="p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
            <Plus className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-white">建立新邀請碼</h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              自訂邀請碼 (選填，留空自動生成)
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

          <div>
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2.5 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>生成中...</span>
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
            <h2 className="text-base font-semibold text-white">邀請碼清單</h2>
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
                  <th className="py-3.5 px-4">邀請代碼</th>
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
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300 flex items-center gap-2">
                        <span>{item.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.code)}
                          className="p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-white"
                          title="複製邀請碼"
                        >
                          {copiedCode === item.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
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
                      <td className="py-3.5 px-4 text-right">
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
    </div>
  );
}
