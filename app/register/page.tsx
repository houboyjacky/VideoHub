"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { GlassCard } from "@/components/ui/GlassCard";
import { KeyRound, User, Sparkles, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus, update } = useSession();

  const [name, setName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // 1. 若已經是核准會員或待審核，直接自動轉向
  useEffect(() => {
    if (session?.user?.status === "approved") {
      router.replace("/feed");
    } else if (session?.user?.status === "pending" || session?.user?.status === "rejected") {
      router.replace("/pending");
    }
  }, [session, router]);

  // 2. 自動預填 Google 稱呼與邀請碼
  useEffect(() => {
    let filled = false;

    // 自動預填 Google 帳號名稱
    if (session?.user?.name && !name) {
      setName(session.user.name);
      filled = true;
    }

    // 自動預填網址參數 code 或 invite
    const codeParam = searchParams.get("code") || searchParams.get("invite");
    if (codeParam && !inviteCode) {
      setInviteCode(codeParam.trim().toUpperCase());
      filled = true;
    }

    if (filled) {
      setAutoFilled(true);
    }
  }, [session, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), inviteCode: inviteCode.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "註冊失敗，請稍候重試");
      }

      // 刷新 Client 端 NextAuth JWT Session
      await update({
        status: data.autoApproved ? "approved" : "pending",
        name: name.trim(),
      }).catch(() => {});

      if (data.autoApproved) {
        // 自動核准直接進入動態牆
        router.push("/feed");
      } else {
        // 需手動審核跳轉至待審核頁
        router.push("/pending");
      }
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
        <GlassCard className="border border-white/15 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 bg-zinc-950/90 rounded-2xl">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/10">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              歡迎加入 {process.env.NEXT_PUBLIC_APP_NAME || "VideoHub"}
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              請確認您的稱呼並輸入通行邀請碼以完成加入
            </p>
          </div>

          {/* 自動預填提示 */}
          {autoFilled && (
            <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2.5 text-amber-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>已為您自動預填 Google 稱呼與專屬邀請碼</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs sm:text-sm">
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
                  placeholder="例如：王小明 或 創作者的好友"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm text-zinc-100 font-medium"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="inviteCode"
                className="block text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider"
              >
                通行邀請碼
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="inviteCode"
                  type="text"
                  required
                  placeholder="請輸入收到的邀請碼"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 rounded-xl glass-input text-sm font-mono uppercase tracking-wider text-amber-200 font-bold"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim() || !inviteCode.trim()}
              className="w-full mt-2 py-3 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在驗證申請...</span>
                </>
              ) : (
                <span>送出並確認加入</span>
              )}
            </button>
          </form>

          <p className="text-center text-[11px] text-zinc-500 mt-6 leading-relaxed">
            ✨ 若持有免審直通碼將立即開通並解鎖專屬分組；一般邀請碼將由管理員審核後發信通知。
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center text-amber-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
