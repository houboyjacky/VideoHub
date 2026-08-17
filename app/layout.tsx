import type { Metadata } from "next";
import { Inter, Noto_Sans_TC } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  variable: "--font-noto-sans-tc",
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";

export const metadata: Metadata = {
  title: `${appName} — 私人影片分享空間`,
  description: `Exclusive video streaming space for friends and family powered by ${appName}.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-TW"
      className={`${inter.variable} ${notoSansTC.variable} dark`}
    >
      <body className="font-sans antialiased bg-[#0a0a0f] text-zinc-100 min-h-screen relative selection:bg-amber-500/30 selection:text-amber-200">
        {/* 微光背景氛圍特效 */}
        <div className="ambient-glow" aria-hidden="true" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          
          {/* 🌟 醒目全站頁尾 (Enhanced Premium Footer) */}
          <footer className="mt-16 border-t border-white/10 bg-[#0c0c14]/90 backdrop-blur-2xl text-xs text-zinc-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
              {/* 上半部：品牌標識、合規宣告與三大核心政策按鈕 */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                {/* 品牌名稱與安全合規宣告 */}
                <div className="flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20 text-lg shrink-0">
                    ▶
                  </div>
                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="font-bold text-white text-base tracking-tight">
                        {appName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        私有影音空間
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      嚴格遵循 YouTube 服務條款與 Google API 使用者資料安全保護規範
                    </p>
                  </div>
                </div>

                {/* 醒目政策導覽按鈕群 */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <Link
                    href="/about"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-zinc-200 hover:text-white transition-all text-xs font-medium group shadow-sm"
                  >
                    <span>📘</span>
                    <span>應用程式與 API 政策</span>
                  </Link>

                  <Link
                    href="/privacy"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 hover:border-amber-500/70 text-amber-300 hover:text-white transition-all text-xs font-semibold shadow-md shadow-amber-500/10 hover:scale-[1.02]"
                  >
                    <span>🔒</span>
                    <span>隱私權政策 (Privacy)</span>
                  </Link>

                  <Link
                    href="/terms"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/10 border border-white/10 hover:border-amber-500/40 text-zinc-200 hover:text-white transition-all text-xs font-medium group shadow-sm"
                  >
                    <span>📜</span>
                    <span>服務條款 (Terms)</span>
                  </Link>
                </div>
              </div>

              {/* 下半部：版權宣告與授權撤銷提示 */}
              <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500 text-center sm:text-left">
                <div>
                  © {new Date().getFullYear()} {appName}. All rights reserved. 專為創作者與親友社交圈打造。
                </div>
                <div className="text-zinc-400">
                  使用者可隨時透過 Google 帳戶安全性設定撤銷存取授權，或聯絡管理員刪除帳號資料。
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
