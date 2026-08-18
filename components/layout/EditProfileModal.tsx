"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { UserCheck, Loader2, X, CheckCircle2, AlertCircle, Edit3, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface EditProfileModalProps {
  currentName?: string | null;
  email?: string | null;
  trigger?: React.ReactNode;
}

export function EditProfileModal({
  currentName = "",
  email = "",
  trigger,
}: EditProfileModalProps) {
  const router = useRouter();
  const { update } = useSession();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setName(currentName || "");
      setError(null);
      setSuccess(null);
    }
  }, [open, currentName]);

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
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "修改稱呼失敗");
      }

      setSuccess("🎉 稱呼已成功更新！");
      // 更新 NextAuth session 中的 name
      await update({ name: name.trim() }).catch(() => {});

      setTimeout(() => {
        setOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1200);
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
        className="w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="p-6 sm:p-7 border border-white/20 shadow-2xl space-y-6 bg-zinc-950/95 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
                <Edit3 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <span>修改個人稱呼</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h3>
                <p className="text-xs text-zinc-400">
                  自訂在網站與管理員看到的顯示名稱
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
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {email && (
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-400">
                  登入帳號（Email）
                </label>
                <div className="px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-zinc-400">
                  {email}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs sm:text-sm font-semibold text-zinc-200">
                您的稱呼或姓名
              </label>
              <input
                type="text"
                required
                maxLength={50}
                placeholder="例如：王小明 或 攝影同好"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl glass-input text-base text-zinc-100 bg-black/60 border border-white/20 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 font-medium"
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-zinc-400">
                ✨ 更新後，全站導航列與後台人員記錄將同步更新您的稱呼。
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl glass-btn text-xs sm:text-sm font-medium text-zinc-300 hover:text-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-6 py-2.5 rounded-xl glass-btn-primary flex items-center gap-2 text-xs sm:text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>儲存中...</span>
                  </>
                ) : (
                  <span>確認修改</span>
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
          onClick={() => setOpen(true)}
          className="p-1.5 text-zinc-400 hover:text-amber-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          title="修改個人稱呼"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
