"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Film,
  Users,
  ShieldCheck,
  Lock,
  ArrowLeft,
  Sparkles,
  Info,
  ExternalLink,
  CheckCircle2,
  KeyRound,
  FileText,
} from "lucide-react";

export default function AboutAndApiDisclosurePage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@your-domain.com";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 animate-fade-in space-y-8">
      {/* 頂部導航與語言切換 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === "zh"
                ? "應用程式用途與 Google API 資料政策遵循說明"
                : "Application Purpose & Google API Data Disclosure"}
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {lang === "zh"
                ? `${appName} 應用程式定位、主要功能、API 資料用途與 Google 使用者資料政策遵循聲明`
                : `${appName} Application Scope, Key Features, API Data Usage & Google Limited Use Disclosure`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* 語言切換按鈕 */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10">
            <button
              onClick={() => setLang("zh")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                lang === "zh"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              繁體中文
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                lang === "en"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              English
            </button>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === "zh" ? "返回首頁" : "Back Home"}</span>
          </Link>
        </div>
      </div>

      {lang === "zh" ? (
        /* 繁體中文版本 */
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* 1. 核心定位與簡介 */}
          <GlassCard className="p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>應用程式簡介與核心定位</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              什麼是 {appName}？
            </h2>
            <p className="leading-relaxed">
              {appName}{" "}
              是一個專為個人創作者、特定社交圈與家庭成員量身打造的私有影音串流平台。創作者常有許多特定影音（如家庭聚會紀錄、好友旅行、內部專案影片），不適合完全公開至大眾社群，但需要一個優雅、直覺且具備細緻權限分組的私有影音空間來與親朋好友分享。
            </p>
          </GlassCard>

          {/* 2. 應用程式四大主要功能 */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>應用程式主要功能 (Key Features)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>公開影音免登入試看</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  一般訪客與審查人員無需登入即可直接瀏覽並線上播放精選的公開影片，完整體驗平台播放介面。
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>YouTube 頻道自動同步</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  站長可一鍵將 YouTube 頻道的公開或不公開影片資訊（ID、標題、封面縮圖）同步至資料庫集中管理。
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>細緻分組權限隔離</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  管理員可建立「家人」、「登山好友」、「專案同好」等不同群組，僅授權群組內的會員可觀看對應的私有影片。
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>邀請碼審核安全機制</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  使用者使用 Google 登入後，需輸入專屬邀請碼並經由管理員人工審核開通，杜絕未經授權的外部存取。
                </p>
              </div>
            </div>
          </div>

          {/* 3. 為什麼使用 Google 帳號與 YouTube API？ */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>為什麼使用 Google 帳號與 YouTube API？</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-5 border border-white/10 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">1. 簡化身分驗證</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  避免使用者重複註冊帳號與密碼外洩風險，透過 Google OAuth 2.0 提供安全可靠的一鍵登入驗證。
                </p>
              </GlassCard>

              <GlassCard className="p-5 border border-white/10 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Film className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">2. 創作者影音同步</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  創作者使用 YouTube API (<code>youtube.readonly</code>) 自動擷取影片列表，省去手動複製貼上網址的繁瑣流程。
                </p>
              </GlassCard>

              <GlassCard className="p-5 border border-white/10 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">3. 精準社交圈隔離</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  系統根據使用者的 Google Email 綁定邀請碼與群組身分，確保私有影片僅對特定受邀親友開放。
                </p>
              </GlassCard>
            </div>
          </div>

          {/* 4. 權限分級與使用範圍宣告 (Role-Based Access Disclosure) */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>權限分級與使用範圍宣告 (Role-Based Authorization)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-blue-500/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                    User
                  </div>
                  <h4 className="font-bold text-white text-sm">一般訪客與會員 (General Members)</h4>
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  <p>
                    • <strong>僅需基本身分登入：</strong>一般親友會員登入僅請求 <code>openid, email, profile</code> 基本驗證資訊，用於識別身分與審核授權。
                  </p>
                  <p className="text-emerald-400 font-medium">
                    • <strong>絕不存取會員的 YouTube 資料：</strong>系統在後端絕不會讀取、查詢或存取一般會員個人的任何 YouTube 影片、播放清單或個人頻道。
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                    Admin
                  </div>
                  <h4 className="font-bold text-white text-sm">系統管理員 (Administrator Only)</h4>
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  <p>
                    • <strong>專用於管理員創作頻道同步：</strong>YouTube Data API 唯讀權限 (<code>youtube.readonly</code>) <strong>僅限系統管理員本人使用</strong>。
                  </p>
                  <p className="text-amber-300 font-medium">
                    • <strong>後台同步用途：</strong>僅在管理員於後台執行頻道同步時，讀取管理員自己的頻道影片（標題、ID、縮圖）以便在平台內建立分組。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Google 使用者資料政策遵循與有限用途宣告 */}
          <div className="p-6 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Google API 使用者資料有限用途遵循聲明 (Limited Use Disclosure)
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {appName} 嚴格遵循{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline hover:text-amber-300"
              >
                Google API 服務：使用者資料政策 (包括有限用途要求)
              </a>
              ，並具體承諾以下安全原則：
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-zinc-300 pl-2">
              <li>
                <strong>絕不轉移或出售資料：</strong>我們絕不會將您的個人資訊、Google 帳號資料或影音紀錄出售、租賃或轉讓給任何第三方廣告商或數據分析機構。
              </li>
              <li>
                <strong>不用於 AI 訓練：</strong>從 Google 或 YouTube API 獲取的任何使用者資料，均不會被用於訓練、微調通用人工智慧或機器學習模型。
              </li>
              <li>
                <strong>最小權限原則：</strong>本系統僅請求必要的最低權限（如 Google 登入基本資訊與 YouTube 唯讀權限 <code>youtube.readonly</code>），絕不請求或修改任何不相關之資料。
              </li>
              <li>
                <strong>隨時可撤銷授權：</strong>使用者可隨時至{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Google 帳戶安全性設定
                </a>{" "}
                撤銷對本平台的存取權。
              </li>
            </ul>
          </div>

          {/* 5. 3 步驟運作流程 */}
          <GlassCard className="p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold text-base">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <h3>三步驟加入與運作流程 (How It Works)</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="text-amber-400 font-mono font-bold">01. Google 登入</div>
                <div className="font-semibold text-white">點擊登入按鈕</div>
                <p className="text-zinc-400 text-[11px]">透過 Google OAuth 2.0 安全驗證身份。</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="text-amber-400 font-mono font-bold">02. 填寫邀請碼</div>
                <div className="font-semibold text-white">輸入邀請碼申請</div>
                <p className="text-zinc-400 text-[11px]">輸入專屬邀請碼並提交加入申請。</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="text-amber-400 font-mono font-bold">03. 審核開通</div>
                <div className="font-semibold text-white">解鎖專屬影片</div>
                <p className="text-zinc-400 text-[11px]">收到審核通過信件，即可暢看授權分組影片。</p>
              </div>
            </div>
          </GlassCard>
        </div>
      ) : (
        /* English Version */
        <div className="space-y-8 text-zinc-300 text-sm leading-relaxed">
          {/* 1. Core Overview */}
          <GlassCard className="p-6 sm:p-8 border border-white/10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Application Purpose &amp; Scope</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              What is {appName}?
            </h2>
            <p className="leading-relaxed">
              {appName} is a private video sharing and streaming management platform designed for
              individual creators, private friend groups, and family members. It enables creators to
              share exclusive video content (such as family gatherings, travel memoirs, and internal
              projects) securely with authorized groups without publishing them publicly to mainstream
              social media.
            </p>
          </GlassCard>

          {/* 2. Key Features */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-400" />
              <span>Key Application Features</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Public Video Previews Without Login</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Visitors and review personnel can freely explore and play sample public videos directly on the homepage without signing in.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>YouTube Channel Video Sync</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Platform owners can synchronize their YouTube video metadata (titles, IDs, thumbnails) via YouTube API seamlessly.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fine-Grained Group Access Control</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Admins organize members into specific groups (e.g. &quot;Family&quot;, &quot;Hiking Friends&quot;) and control video permissions precisely.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <div className="font-semibold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Invite-Code &amp; Approval Security</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Members must submit an invite code upon Google Sign-In and undergo admin approval before viewing private streams.
                </p>
              </div>
            </div>
          </div>

          {/* 3. Why We Use Google Account & YouTube API */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Why We Use Google Account &amp; YouTube API</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-5 border border-white/10 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">1. Secure Authentication</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Google OAuth 2.0 simplifies user login and mitigates password leak risks by providing trusted one-click authentication.
                </p>
              </GlassCard>

              <GlassCard className="p-5 border border-white/10 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Film className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">2. Creator Channel Sync</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The YouTube Data API (<code>youtube.readonly</code>) retrieves video lists automatically, eliminating manual entry.
                </p>
              </GlassCard>

              <GlassCard className="p-5 border border-white/10 space-y-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-white text-sm">3. Group Isolation</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  The user&apos;s Google Email is bound to approval queues, ensuring private videos are accessible only to authorized circles.
                </p>
              </GlassCard>
            </div>
          </div>

          {/* 4. Role-Based Scope & Authorization Disclosure */}
          <div className="space-y-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <span>Role-Based Scope &amp; Authorization Disclosure</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-blue-500/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                    User
                  </div>
                  <h4 className="font-bold text-white text-sm">General Visitors &amp; Members</h4>
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  <p>
                    • <strong>Basic Sign-In Only:</strong> General members sign in with standard <code>openid, email, profile</code> scopes strictly for identity verification and membership approval.
                  </p>
                  <p className="text-emerald-400 font-medium">
                    • <strong>No YouTube Access for Users:</strong> The platform NEVER reads, queries, or accesses any YouTube videos, playlists, or private channel data belonging to general members.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                    Admin
                  </div>
                  <h4 className="font-bold text-white text-sm">System Administrator (Owner Only)</h4>
                </div>
                <div className="text-xs text-zinc-300 space-y-1.5 leading-relaxed">
                  <p>
                    • <strong>Dedicated Creator Channel Sync:</strong> The YouTube Data API read-only scope (<code>youtube.readonly</code>) is <strong>strictly reserved for the system administrator</strong>.
                  </p>
                  <p className="text-amber-300 font-medium">
                    • <strong>Admin Sync Purpose:</strong> Only triggered when the admin initiates channel synchronization in the dashboard to import their own creator video metadata (IDs, titles, thumbnails) into the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Google Limited Use Disclosure */}
          <div className="p-6 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Google API Services User Data Policy Compliance (Limited Use)
              </h3>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {appName}&apos;s use and transfer of information received from Google APIs to any other app
              will adhere to{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline hover:text-amber-300"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 text-xs text-zinc-300 pl-2">
              <li>
                <strong>No Data Transfer or Selling:</strong> We never transfer, sell, or rent your personal
                information or Google data to third parties.
              </li>
              <li>
                <strong>No AI Model Training:</strong> User data and video content are never used to train
                generalized AI or machine learning models.
              </li>
              <li>
                <strong>Minimal Scopes:</strong> We strictly request only read-only scopes (<code>youtube.readonly</code>).
              </li>
              <li>
                <strong>Revoke Access Anytime:</strong> You may revoke access at any time via{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Google Account Security Settings
                </a>.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 聯絡我們區塊 */}
      <GlassCard className="p-5 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div>
          <div className="font-semibold text-white text-sm">
            {lang === "zh" ? "聯絡開發者與管理員" : "Contact & Support"}
          </div>
          <p className="text-zinc-400 text-[11px] mt-0.5">
            {lang === "zh"
              ? "若您對本專案的 API 串接、隱私政策或使用上有任何問題，歡迎來信聯繫："
              : "For inquiries regarding API integration, privacy policy or platform usage, please contact:"}
          </p>
        </div>
        <div className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 font-mono text-amber-300 text-xs shrink-0">
          {contactEmail}
        </div>
      </GlassCard>

      {/* 底部政策導航 */}
      <div className="pt-6 border-t border-white/10 text-center text-xs text-zinc-500 space-x-4">
        <Link href="/privacy" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "隱私權政策 (Privacy Policy)" : "Privacy Policy"}
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "服務條款 (Terms of Service)" : "Terms of Service"}
        </Link>
        <span>•</span>
        <Link href="/" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "回到首頁" : "Home"}
        </Link>
      </div>
    </div>
  );
}
