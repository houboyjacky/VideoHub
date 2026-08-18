"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { FileText, ArrowLeft, Globe, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function TermsOfServicePage() {
  const [lang, setLang] = useState<"zh" | "en">("zh");
  const [appName, setAppName] = useState<string>(process.env.NEXT_PUBLIC_APP_NAME || "VideoHub");
  const [contactEmail, setContactEmail] = useState<string>(process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@your-domain.com");

  React.useEffect(() => {
    fetch("/api/system/brand")
      .then((res) => res.json())
      .then((data) => {
        if (data.appName) setAppName(data.appName);
        if (data.contactEmail) setContactEmail(data.contactEmail);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10 animate-fade-in">
      {/* 頂部導航與語言切換 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {lang === "zh" ? "應用程式服務條款" : "Terms of Service"}
            </h1>
            <p className="text-xs text-zinc-400">
              {lang === "zh"
                ? `${appName} 使用者服務協議與 YouTube API 服務規範遵循`
                : `${appName} User Agreement & YouTube API Terms of Service Compliance`}
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

      {/* 條款內容主體 */}
      <GlassCard className="p-6 sm:p-10 border border-white/10 space-y-8 text-zinc-300 text-sm leading-relaxed">
        {lang === "zh" ? (
          /* 繁體中文版本 */
          <div className="space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-400 tracking-wider uppercase">
                最後生效日期：2026 年 8 月 17 日
              </span>
              <h2 className="text-lg font-bold text-white">
                歡迎使用 {appName}（以下簡稱「本服務」或「本平台」）
              </h2>
              <p>
                請在使用本平台前詳細閱讀本服務條款。當您透過 Google 帳號登入、填寫邀請碼或使用本平台所提供之任何服務時，即表示您已充分理解、同意並願意遵守本服務條款及相關法律規定。
              </p>
            </div>

            <hr className="border-white/10" />

            {/* 1. 服務說明與定位 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  1
                </span>
                服務範疇與定位
              </h3>
              <p>
                {appName} 是一個專為個人創作者、特定好友圈與家庭成員設計的現代化私有影音分享系統。本平台提供影片索引、好友分組分類管理、邀請碼審核與私有串流播放導引服務。
              </p>
            </div>

            {/* 2. YouTube API 服務規範與第三方條款遵循 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-3">
              <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                YouTube API 服務與 Google 服務條款遵循聲明
              </h3>
              <p className="text-xs leading-relaxed text-zinc-300">
                本平台使用 YouTube API 服務（YouTube API Services）來同步與展示影音內容。使用本服務即代表您同時同意並受到以下第三方條款之約束：
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-300 pl-2">
                <li>
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300 font-semibold"
                  >
                    YouTube 服務條款 (YouTube Terms of Service)
                  </a>
                </li>
                <li>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300 font-semibold"
                  >
                    Google 隱私權政策 (Google Privacy Policy)
                  </a>
                </li>
              </ul>
              <p className="text-xs text-zinc-400 pt-1">
                所有影音內容均由 YouTube 官方播放器進行安全串流播放，本平台不下載、重製或繞過 YouTube 官方保護機制。
              </p>
            </div>

            {/* 3. 使用者義務與行為守則 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  2
                </span>
                使用者行為守則
              </h3>
              <p>使用者在使用本平台時，應遵守下列守則：</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>不得將未公開或特定分組專屬的影片網址擅自外流、轉載或公開傳播。</li>
                <li>不得以任何自動化腳本、爬蟲或逆向工程手段干擾本平台之正常運作。</li>
                <li>不得轉售、冒用他人邀請碼或散布不實登入憑證。</li>
              </ul>
            </div>

            {/* 4. 免責聲明與責任限制 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  3
                </span>
                免責聲明與服務變更
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>本平台依「現況 (As-Is)」提供服務，不保證服務絕對無中斷或零錯誤。</li>
                <li>若因 YouTube 官方 API 異動、伺服器例行維護或不可抗力因素導致暫時無法播放，本平台不承擔相應之損害賠償責任。</li>
                <li>管理員保留隨時終止、暫停任何違規使用者帳號或調整分組權限之權利。</li>
              </ul>
            </div>

            {/* 5. 聯絡方式 */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  4
                </span>
                聯絡我們
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                若對本服務條款有任何疑問，請與我們聯繫：
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
                Last Effective Date: August 17, 2026
              </span>
              <h2 className="text-lg font-bold text-white">
                Terms of Service for {appName} (&quot;the Service&quot;, &quot;we&quot;, &quot;us&quot;)
              </h2>
              <p>
                Please read these Terms of Service carefully before accessing or using our platform. By
                signing in with Google, entering an invite code, or using the Service, you agree to be
                bound by these Terms and all applicable laws.
              </p>
            </div>

            <hr className="border-white/10" />

            {/* 1. Scope of Service */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  1
                </span>
                Scope of Service
              </h3>
              <p>
                {appName} is a private video sharing and management platform designed for creator
                channels, designated friend groups, and family members. It provides video indexing,
                group segmentation, invite approval, and private streaming access.
              </p>
            </div>

            {/* 2. YouTube Terms Compliance */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.04] border border-amber-500/30 space-y-3">
              <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                YouTube API Services &amp; Google Terms Compliance
              </h3>
              <p className="text-xs leading-relaxed text-zinc-300">
                The Service utilizes YouTube API Services to synchronize and present video content. By
                using the Service, you agree to be bound by:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-xs text-zinc-300 pl-2">
                <li>
                  <a
                    href="https://www.youtube.com/t/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300 font-semibold"
                  >
                    YouTube Terms of Service (ToS)
                  </a>
                </li>
                <li>
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 underline hover:text-amber-300 font-semibold"
                  >
                    Google Privacy Policy
                  </a>
                </li>
              </ul>
              <p className="text-xs text-zinc-400 pt-1">
                All video playback is rendered strictly via the official YouTube embedded player. The
                Service does not scrape, download, or bypass YouTube DRM or protection mechanisms.
              </p>
            </div>

            {/* 3. User Conduct */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  2
                </span>
                User Conduct &amp; Prohibited Activities
              </h3>
              <p>Users must adhere to the following rules:</p>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>Do not leak, redistribute, or publicly post private or unlisted video URLs.</li>
                <li>Do not use automated bots, crawlers, or reverse-engineering tools against the Service.</li>
                <li>Do not sell or abuse invite codes.</li>
              </ul>
            </div>

            {/* 4. Disclaimer & Limitation of Liability */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  3
                </span>
                Disclaimer &amp; Termination
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm pl-2 text-zinc-400">
                <li>The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.</li>
                <li>We are not liable for temporary service interruptions caused by third-party API changes.</li>
                <li>Administrators reserve the right to revoke user access at any time for policy violations.</li>
              </ul>
            </div>

            {/* 5. Contact */}
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs text-amber-400 font-mono">
                  4
                </span>
                Contact
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400">
                For questions regarding these Terms, please contact:
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
        <Link href="/privacy" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "隱私權政策 (Privacy Policy)" : "Privacy Policy"}
        </Link>
        <span>•</span>
        <Link href="/" className="hover:text-amber-400 transition-colors underline">
          {lang === "zh" ? "回到首頁" : "Home"}
        </Link>
      </div>
    </div>
  );
}
