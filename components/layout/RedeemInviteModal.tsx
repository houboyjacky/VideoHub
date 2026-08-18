"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyRound, Loader2, X, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface RedeemInviteModalProps {
  trigger?: React.ReactNode;
  defaultOpen?: boolean;
}

export function RedeemInviteModal({ trigger, defaultOpen = false }: RedeemInviteModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 監聽 ESC 鍵關閉與鎖定背景滾動
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

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
      }, 1500);
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

  const modalContent = open ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg relative"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-6 sm:p-8 border border-white/20 shadow-2xl space-y-6 bg-zinc-950/95 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <KeyRound className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>輸入邀請碼兌換</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  輸入邀請通行碼即刻開通專屬影音觀看權限
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="關閉"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-zinc-200">
                請輸入邀請通行碼
              </label>
              <input
                type="text"
                required
                placeholder="例如：VIP-XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
                className="w-full px-4 py-4 rounded-xl glass-input text-lg sm:text-xl font-mono uppercase tracking-widest text-center text-amber-200 bg-black/60 border border-white/20 selection:bg-amber-500/30 font-bold focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-center">
                ✨ 兌換後系統將自動將對應分組加入您的權限中，影片動態牆將即刻刷新。
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-5 py-3 rounded-xl glass-btn text-sm font-medium text-zinc-300 hover:text-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="px-7 py-3 rounded-xl glass-btn-primary flex items-center gap-2 text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
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
  ) : null;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
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
      )}

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
