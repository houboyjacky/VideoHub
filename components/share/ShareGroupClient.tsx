"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Lock,
  Play,
  Sparkles,
  CheckCircle2,
  Calendar,
  KeyRound,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  Film,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { signIn } from "next-auth/react";

interface VideoItem {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string | Date;
  shootingDate?: string | Date | null;
  tags?: string[];
}

interface ShareGroupClientProps {
  group: {
    id: string;
    name: string;
    description?: string | null;
    shareId: string;
  };
  totalCount: number;
  videos: VideoItem[];
  isLoggedIn: boolean;
  isUnlocked: boolean;
  initialCode?: string;
}

export function ShareGroupClient({
  group,
  totalCount,
  videos,
  isLoggedIn,
  isUnlocked,
  initialCode = "",
}: ShareGroupClientProps) {
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [locallyUnlocked, setLocallyUnlocked] = useState(isUnlocked);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 監聽 ESC 鍵關閉與鎖定滾動
  useEffect(() => {
    if (!redeemModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRedeemModalOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [redeemModalOpen]);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setRedeeming(true);
    setRedeemError(null);

    try {
      const res = await fetch("/api/share/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "兌換失敗，請確認邀請碼是否正確");
      }

      setLocallyUnlocked(true);
      setRedeemSuccess(`🎉 成功解鎖「${group.name}」專屬分組！`);
      setTimeout(() => {
        setRedeemModalOpen(false);
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRedeemError(err.message);
      } else {
        setRedeemError("發生未知錯誤");
      }
    } finally {
      setRedeeming(false);
    }
  };

  const handleGuestLogin = () => {
    const callbackUrl = initialCode
      ? `/share/group/${group.shareId}?code=${initialCode}`
      : `/share/group/${group.shareId}`;
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen pb-32">
      {/* 頂部 Header */}
      <header className="relative pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-center space-y-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>專屬邀請分享預覽</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          {group.name}
        </h1>

        {group.description && (
          <p className="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            {group.description}
          </p>
        )}

        <div className="flex items-center justify-center gap-4 text-xs sm:text-sm text-zinc-400 font-mono pt-2">
          <span className="flex items-center gap-1.5 bg-white/[0.04] px-3 py-1 rounded-full border border-white/5">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>收錄 {totalCount} 部專屬影音</span>
          </span>
          {locallyUnlocked && (
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>您已擁有此分組存取權限</span>
            </span>
          )}
        </div>

        {redeemSuccess && (
          <div className="max-w-md mx-auto p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{redeemSuccess}</span>
            <Link href="/feed" className="underline font-semibold ml-2 text-white hover:text-amber-300">
              前往動態牆 →
            </Link>
          </div>
        )}
      </header>

      {/* 影片預覽清單 (Teaser 縮圖) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {videos.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            此分組目前尚未新增任何影片。
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((v, index) => {
              const displayDate = v.shootingDate || v.publishedAt;
              const dateStr = displayDate
                ? new Date(displayDate).toLocaleDateString("zh-TW")
                : "";

              return (
                <GlassCard
                  key={v.id}
                  className="overflow-hidden border border-white/10 shadow-xl group flex flex-col"
                >
                  {/* 縮圖區域 */}
                  <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                    {/* 縮圖背景 */}
                    <img
                      src={v.thumbnail}
                      alt={v.title}
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        locallyUnlocked
                          ? "group-hover:scale-105"
                          : "filter blur-[8px] scale-110 opacity-70"
                      }`}
                    />

                    {/* Teaser 鎖頭遮罩（未解鎖時顯示） */}
                    {!locallyUnlocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[4px] flex flex-col items-center justify-center gap-2 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-black/60 border border-amber-500/40 flex items-center justify-center shadow-lg">
                          <Lock className="w-5 h-5 text-amber-400" />
                        </div>
                        <span className="text-xs font-semibold text-white/90 drop-shadow">
                          登入解鎖完整播放
                        </span>
                      </div>
                    )}

                    {/* 已解鎖時的 Play 按鈕浮層 */}
                    {locallyUnlocked && (
                      <Link
                        href={`/video/${v.id}`}
                        className="absolute inset-0 bg-black/20 hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-xl">
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* 影片標題與資訊 */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors">
                      {v.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-2 border-t border-white/5 font-mono">
                      {dateStr && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{dateStr}</span>
                        </span>
                      )}
                      <span className="text-[11px] text-amber-400/80 font-sans">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {totalCount > 12 && (
          <p className="text-center text-xs text-zinc-500 pt-4">
            — 僅展示前 12 支精選影音，登入並取得通行權限後即可在動態牆瀏覽全部 {totalCount} 支影片 —
          </p>
        )}
      </main>

      {/* 底部固定 CTA 懸浮列 */}
      <div className="fixed bottom-0 inset-x-0 z-40 p-4 bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{locallyUnlocked ? "您已解鎖此分組內容" : "探索更多專屬影音內容"}</span>
            </h4>
            <p className="text-xs text-zinc-400">
              {locallyUnlocked
                ? "隨時前往個人影片動態牆暢享所有已開通內容"
                : "持通行邀請碼登入即可立即解鎖完整影片串流"}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {locallyUnlocked ? (
              <Link
                href="/feed"
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-xl"
              >
                <span>前往動態牆觀看全部</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            ) : isLoggedIn ? (
              <button
                type="button"
                onClick={() => setRedeemModalOpen(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-xl cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>輸入邀請碼解鎖</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 flex items-center justify-center gap-2.5 text-xs sm:text-sm font-bold shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>登入以解鎖影片</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {mounted &&
        redeemModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in"
            onClick={() => setRedeemModalOpen(false)}
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
                      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                        兌換通行邀請碼
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-400">
                        解鎖【{group.name}】與專屬影音內容
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRedeemModalOpen(false)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    title="關閉"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {redeemError && (
                  <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
                    <span>{redeemError}</span>
                  </div>
                )}

                <form onSubmit={handleRedeem} className="space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-200">
                      請輸入收到的邀請通行碼
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="例如：VIP-XXXXXX"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.trim().toUpperCase())}
                      className="w-full px-4 py-4 rounded-xl glass-input text-lg sm:text-xl font-mono uppercase tracking-widest text-center text-amber-200 bg-black/60 border border-white/20 selection:bg-amber-500/30 font-bold focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                      disabled={redeeming}
                      autoFocus
                    />
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-center">
                      ✨ 驗證成功後將立即為您的帳號開通此分組，可即刻觀看所有完整影片。
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setRedeemModalOpen(false)}
                      className="px-5 py-3 rounded-xl glass-btn text-sm font-medium text-zinc-300 hover:text-white cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={redeeming || !inviteCode.trim()}
                      className="px-7 py-3 rounded-xl glass-btn-primary flex items-center gap-2 text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {redeeming ? (
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
          </div>,
          document.body
        )}
    </div>
  );
}
