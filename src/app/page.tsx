import React from "react";
import Link from "next/link";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GlassCard } from "@/components/ui/GlassCard";
import { HomePublicVideos } from "@/components/HomePublicVideos";
import {
  Sparkles,
  ExternalLink,
} from "lucide-react";

import { getAppBrandConfig } from "@/lib/application/use-cases/system-settings.usecase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { appName } = await getAppBrandConfig();

  // 查詢公開可見之影音清單供首頁公開試看
  const rawPublicVideos = await prisma.video.findMany({
    where: {
      deleted: false,
      ytPrivacyStatus: "public",
    },
    orderBy: [
      { shootingDate: "desc" },
      { publishedAt: "desc" },
    ],
    take: 50,
    select: {
      id: true,
      ytId: true,
      title: true,
      thumbnail: true,
      publishedAt: true,
      shootingDate: true,
    },
  });

  const publicVideos = rawPublicVideos.map((v) => ({
    id: v.id,
    ytId: v.ytId,
    title: v.title,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt.toISOString(),
    shootingDate: v.shootingDate ? v.shootingDate.toISOString() : null,
  }));

  return (
    <div className="min-h-screen relative z-10 text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* 頂部輕量導航列 */}
      <header className="w-full border-b border-white/10 bg-[#0a0a0f]/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt={appName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg shadow-lg shadow-amber-500/20"
            />
            <span className="text-lg font-bold tracking-tight text-white">
              {appName}
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/about"
              className="text-xs text-zinc-300 hover:text-amber-300 transition-colors font-medium hidden sm:inline"
            >
              應用程式與 API 說明
            </Link>
            <Link
              href="/privacy"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              隱私權政策
            </Link>
            <Link
              href="/terms"
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              服務條款
            </Link>

            {/* 右上角直接觸發 Google 登入 */}
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/feed" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 text-xs font-semibold transition-all shadow-md hover:shadow-amber-500/20 hover:scale-[1.02]"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                <span>登入系統</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* 主內容容器 */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* 1. Hero 核心主視覺與簡介 */}
        <section className="pt-6 sm:pt-12 text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>私人影音分享與社交圈串流管理平台</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              專屬於好友與家庭的 <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                私有影音串流空間
              </span>
            </h1>

            {/* 應用程式用途說明（中英雙語對照） */}
            <div className="space-y-2 max-w-2xl mx-auto text-zinc-300 pt-2">
              <p className="text-sm sm:text-base leading-relaxed">
                <strong>{appName}</strong> 是一個專為個人創作者、好友圈與家庭成員設計的私有影音分享系統。提供精選公開影音線上免登入試看，並支援創作者 YouTube 頻道影音同步與細緻的社交圈分組權限隔離，讓受邀親友能安心瀏覽專屬影音內容。
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                <strong>{appName}</strong> is a private video streaming platform for creators and family/friends. Visitors can preview featured public videos without login, while invited members sign in via Google to access private shared content.
              </p>
            </div>

            {/* 行動呼籲按鈕組 */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/feed" });
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-semibold text-sm transition-all duration-300 shadow-xl hover:shadow-amber-500/10 hover:-translate-y-0.5"
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
                  <span>使用 Google 帳號登入</span>
                </button>
              </form>

              <Link
                href="/about"
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl glass-btn text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white hover:border-amber-500/40 transition-all"
              >
                <span>應用程式與 API 政策說明</span>
                <ExternalLink className="w-4 h-4 text-amber-400" />
              </Link>
            </div>
          </div>
        </section>

        {/* 2. 精選公開影音專區 (公開免登入，訪客與審查員可直接觀看) */}
        <section className="space-y-4">
          <HomePublicVideos videos={publicVideos} />
        </section>
      </main>
    </div>
  );
}
