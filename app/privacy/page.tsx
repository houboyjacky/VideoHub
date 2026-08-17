"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { ShieldCheck, ArrowLeft, Globe, Lock, FileText, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@your-domain.com";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 animate-fade-in">
      {/* 頂部導航與語言切換 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === "zh" ? "應用程式隱私權政策" : "Privacy Policy"}
            </h1>
            <p className="text-xs text-zinc-400">
              {lang === "zh"
                ? `${appName} 個人資料保護與 Google 使用者數據處理政策`
                : `${appName} Personal Data Protection & Google User Data Policy`}
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

      {/* 隱私權政策內容主體 */}
      <GlassCard className="p-6 sm:p-10 border border-white/10 space-y-8 text-zinc-300 text-sm leading-relaxed">
        {lang === "zh" ? (
          /* 繁體中文版本 */
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-400 tracking-wider uppercase">
                最後更新日期：2026 年 8 月 17 日
              </span>
              <h2 className="text-lg font-bold text-white">
                歡迎使用 {appName}（以下簡稱「本平台」或「我們」）
              </h2>
              <p>
                我們非常重視您的個人隱私與個人資料保護。本隱私權政策旨在清楚向您說明我們如何蒐集、處理、利用與保護您在使用本平台服務時所提供的資訊，特別是涉及
                Google OAuth 2.0 與 YouTube Data API 的使用者數據。
              </p>
            </div>

            <hr className="border-white/10" />

            {/* 1. 蒐集的資料類型 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  1
                </span>
                我們所蒐集的資料類型
              </h3>
              <p>當您登入或使用本平台時，我們可能會蒐集以下必要資料：</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>
                  <strong className="text-zinc-200">Google 基本個人資訊：</strong>
                  當您透過 Google 帳號登入時，我們將取得您的電子郵件地址（Email）、公開名稱（Name）與個人檔案照片（Profile Picture），用於識別您的會員身份與審核狀態。
                </li>
                <li>
                  <strong className="text-zinc-200">YouTube 頻道影音數據 (僅限頻道管理者)：</strong>
                  若您授權 YouTube 頻道同步功能（存取範圍：<code>youtube.readonly</code>），我們將讀取您頻道中的影片列表資訊（包含影片 ID、標題、建立時間、隱私狀態與縮圖網址），用於在本平台內進行分組分類與權限展示。
                </li>
                <li>
                  <strong className="text-zinc-200">系統互動紀錄：</strong>
                  包含您加入申請時填寫的稱呼、邀請碼使用紀錄以及系統登入 Session。
                </li>
              </ul>
            </div>

            {/* 2. 資料之使用目的 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  2
                </span>
                資料之使用目的
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>驗證使用者身份，並依管理員審核結果指派對應的社交圈影片分組觀看權限。</li>
                <li>透過 Email 發送邀請審核結果通知（如：審核通過或拒絕）。</li>
                <li>維持系統運作、安全性防護與防止惡意未授權訪問。</li>
              </ul>
            </div>

            {/* 3. 權限分級與使用範圍宣告 (Role-Based Authorization) */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  3
                </span>
                角色權限分級與存取範圍宣告 (Role-Based Access Disclosure)
              </h3>
              <p>本平台針對不同角色實施嚴格的權限隔離原則：</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-blue-500/20 space-y-1.5">
                  <div className="font-bold text-blue-300">👤 一般會員與訪客 (General Members)</div>
                  <p className="text-zinc-300">
                    僅使用 Google 基本身分驗證（<code>openid, email, profile</code>）。系統<strong>絕不會</strong>存取、讀取或使用一般會員個人的任何 YouTube 影片、播放清單或個人頻道。
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-amber-500/20 space-y-1.5">
                  <div className="font-bold text-amber-300">🛡️ 系統管理員 (Administrator Only)</div>
                  <p className="text-zinc-300">
                    YouTube 唯讀存取權限 (<code>youtube.readonly</code>) <strong>僅供管理員同步管理員本人的頻道影片</strong>，用於在站內建立受保護的私有影片分組名冊。
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Google API 使用者數據與 Limited Use 政策遵循 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-3">
              <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Google API 使用者資料保護與「有限使用 (Limited Use)」遵循宣告
              </h3>
              <p className="text-xs leading-relaxed text-zinc-300">
                本平台對從 Google API 獲取的使用者數據之使用與傳輸，完全遵循{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Google API 服務：使用者資料政策 (Google API Services User Data Policy)
                </a>
                ，包括其中的「<strong>有限使用 (Limited Use)</strong>」要求：
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300 pl-2">
                <li><strong>絕不出售或出租：</strong> 我們絕不會將 Google 使用者資料出售、出租或轉移給任何第三方或廣告商。</li>
                <li><strong>絕不用於 AI 訓練：</strong> 我們絕不會將您的個人資料或 YouTube 影音數據用於訓練任何大型語言模型 (LLM) 或通用 AI 模型。</li>
                <li><strong>最小必要權限：</strong> 我們僅向 Google 申請提供核心服務所嚴格必需的唯讀權限（<code>youtube.readonly</code>）。</li>
              </ul>
            </div>

            {/* 4. 資料安全與儲存 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  3
                </span>
                資料儲存與保護機制
              </h3>
              <p>
                本平台採用嚴格的資料庫安全防護措施（包含受密碼保護的獨立 MongoDB、SSL/TLS 全程加密傳輸與安全 HTTP-only Session Cookies），防止您的資訊受到未授權存取、竄改或洩漏。
              </p>
            </div>

            {/* 5. 使用者權利與資料刪除 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  4
                </span>
                使用者權利與 Google 授權撤銷
              </h3>
              <p>您對自己的個人資料享有以下權利：</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>
                  <strong className="text-zinc-200">隨時撤銷 Google 存取授權：</strong>
                  您可以隨時前往{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Google 帳戶安全性設定 (第三方應用程式存取權)
                  </a>
                  ，立即撤銷本平台對您 Google 帳號或 YouTube 資料的存取權限。
                </li>
                <li>
                  <strong className="text-zinc-200">要求刪除帳號與資料：</strong>
                  您可以隨時聯絡管理員，要求自本平台伺服器中永久刪除您的帳號資訊與相關數據。
                </li>
              </ul>
            </div>

            {/* 6. 政策更新與聯絡管道 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  5
                </span>
                聯絡我們
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                如果您對本隱私權政策有任何疑問、建議或資料刪除需求，歡迎隨時透過管理員電子郵件與我們聯繫：
              </p>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 font-mono text-amber-300 text-xs">
                Email: {contactEmail}
              </div>
            </div>
          </div>
        ) : (
          /* English Version */
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-400 tracking-wider uppercase">
                Last Updated: August 17, 2026
              </span>
              <h2 className="text-lg font-bold text-white">
                Welcome to {appName} (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;)
              </h2>
              <p>
                We highly value your privacy and are committed to protecting your personal data. This
                Privacy Policy outlines how we collect, process, utilize, and safeguard your information
                when you use our web platform, especially concerning Google OAuth 2.0 and YouTube Data
                API user data.
              </p>
            </div>

            <hr className="border-white/10" />

            {/* 1. Types of Data Collected */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  1
                </span>
                Information We Collect
              </h3>
              <p>When you log in or interact with the Service, we may collect the following data:</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>
                  <strong className="text-zinc-200">Google Account Profile Information:</strong> Email
                  address, name, and profile picture provided during Google Sign-In to authenticate and
                  manage membership access.
                </li>
                <li>
                  <strong className="text-zinc-200">YouTube Channel & Video Data (Admins only):</strong> When
                  the channel owner authorizes channel synchronization (via the <code>youtube.readonly</code>{" "}
                  scope), we retrieve video metadata (video IDs, titles, publication dates, privacy status,
                  thumbnails) to categorize and manage private streaming access.
                </li>
                <li>
                  <strong className="text-zinc-200">System Activity Logs:</strong> Display names submitted
                  during onboarding, invite code redemption logs, and authenticated session tokens.
                </li>
              </ul>
            </div>

            {/* 2. Purpose of Collection and Use */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  2
                </span>
                How We Use Your Data
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>Authenticate identity and enforce group-level video access permissions.</li>
                <li>Send transactional email notifications regarding invite approval or status changes.</li>
                <li>Maintain server integrity, prevent unauthorized access, and protect user accounts.</li>
              </ul>
            </div>

            {/* 3. Role-Based Scope & Authorization Disclosure */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  3
                </span>
                Role-Based Authorization &amp; Scope Isolation
              </h3>
              <p>We enforce strict role-based data boundary segregation:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-blue-500/20 space-y-1.5">
                  <div className="font-bold text-blue-300">👤 General Members &amp; Visitors</div>
                  <p className="text-zinc-300">
                    Sign in via basic identity scopes (<code>openid, email, profile</code>). The platform <strong>NEVER</strong> accesses, queries, or stores any YouTube videos, playlists, or private channel data of general members.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-amber-500/20 space-y-1.5">
                  <div className="font-bold text-amber-300">🛡️ System Administrator (Owner Only)</div>
                  <p className="text-zinc-300">
                    The YouTube Data API read-only scope (<code>youtube.readonly</code>) is <strong>strictly used by the platform owner</strong> to synchronize their own creator videos into private streaming groups.
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Google API Limited Use Disclosure */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-3">
              <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                Google API User Data Policy & &quot;Limited Use&quot; Compliance
              </h3>
              <p className="text-xs leading-relaxed text-zinc-300">
                {appName}&apos;s use and transfer to any other app of information received from Google APIs
                will adhere to the{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 underline hover:text-amber-300"
                >
                  Google API Services User Data Policy
                </a>
                , including the <strong>Limited Use</strong> requirements:
              </p>
              <ul className="list-disc list-inside space-y-1 text-xs text-zinc-300 pl-2">
                <li><strong>No Sale or Sharing:</strong> We do not sell, rent, or transfer user data to third parties, data brokers, or advertisers.</li>
                <li><strong>No AI Model Training:</strong> We never use user personal data or YouTube content to train generalized AI or machine learning models.</li>
                <li><strong>Minimal Scopes:</strong> We strictly request only read-only scopes (<code>youtube.readonly</code>) essential for core feature functionality.</li>
              </ul>
            </div>

            {/* 4. Data Storage & Security */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  3
                </span>
                Data Storage and Security
              </h3>
              <p>
                We implement industry-standard security safeguards, including encrypted HTTPS/TLS
                transmissions, secure HTTP-only cookies, and access-restricted database infrastructure,
                to protect against unauthorized access, disclosure, or alteration.
              </p>
            </div>

            {/* 5. User Rights & Revocation */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  4
                </span>
                Your Rights & Revoking Google Access
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>
                  <strong>Revoke Access Anytime:</strong> You can revoke {appName}&apos;s access to your Google
                  Account at any time via{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300"
                  >
                    Google Account Security Settings
                  </a>.
                </li>
                <li>
                  <strong>Data Deletion Request:</strong> You may contact the administrator at any time to
                  permanently delete your account and associated records from our server.
                </li>
              </ul>
            </div>

            {/* 6. Contact Information */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  5
                </span>
                Contact Us
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                If you have any questions or data requests regarding this Privacy Policy, please contact us:
              </p>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 font-mono text-amber-300 text-xs">
                Email: {contactEmail}
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* 底部政策導航 */}
      <div className="mt-8 text-center text-xs text-zinc-500 space-x-4">
        <Link href="/terms" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "應用程式服務條款 (Terms of Service)" : "Terms of Service"}
        </Link>
        <span>•</span>
        <Link href="/" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "回到首頁" : "Home"}
        </Link>
      </div>
    </div>
  );
}
