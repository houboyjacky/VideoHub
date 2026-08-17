"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyRound, User, Sparkles, Loader2, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, inviteCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "註冊失敗，請稍候重試");
      }

      // 成功後跳轉至待審核頁
      router.push("/pending");
      router.refresh();
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md">
        <GlassCard className="border border-white/10 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              歡迎來到 {process.env.NEXT_PUBLIC_APP_NAME || "VideoHub"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              請填寫您的稱呼並輸入邀請碼以送出加入申請
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider"
              >
                您的稱呼或姓名
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="例如：王小明 或 Jacky的朋友"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="inviteCode"
                className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider"
              >
                邀請碼
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="inviteCode"
                  type="text"
                  required
                  placeholder="請輸入收到的邀請碼"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm font-mono uppercase tracking-wider"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在驗證申請...</span>
                </>
              ) : (
                <span>送出申請</span>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-zinc-500 mt-6">
            送出後將由管理員手動審核，通過後將發送 Email 通知
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
