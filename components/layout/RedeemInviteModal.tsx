"use client";

import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyRound, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function RedeemInviteModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/share/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "兌換失敗，請確認邀請碼是否有效");
      }

      setSuccess(data.message || "🎉 成功解鎖專屬分組！");
      setCode("");
      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1800);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("發生未知錯誤");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSuccess(null);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 rounded-lg transition-colors cursor-pointer"
        title="輸入邀請碼解鎖更多專屬分組"
      >
        <KeyRound className="w-3.5 h-3.5" />
        <span>輸入邀請碼</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md">
            <GlassCard className="p-6 border border-white/10 shadow-2xl space-y-4 bg-zinc-950/90">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <KeyRound className="w-5 h-5" />
                  <h3 className="text-base font-bold text-white">解鎖專屬影音分組</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-zinc-300">
                    請輸入收到的邀請通行碼
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如：VIP-XXXXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-sm font-mono uppercase tracking-wider text-white"
                    disabled={loading}
                    autoFocus
                  />
                  <p className="text-[11px] text-zinc-400">
                    兌換後系統將自動將對應分組加入您的權限中，影片動態牆將即刻刷新。
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !code.trim()}
                    className="px-5 py-2 rounded-xl glass-btn-primary flex items-center gap-2 text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>驗證中...</span>
                      </>
                    ) : (
                      <span>立即兌換</span>
                    )}
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>
        </div>
      )}
    </>
  );
}
