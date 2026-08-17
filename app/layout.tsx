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
          
          {/* 全站頁尾 (Footer) */}
          <footer className="py-6 border-t border-white/5 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                © {new Date().getFullYear()} {appName}. All rights reserved.
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/about"
                  className="hover:text-amber-400 transition-colors"
                >
                  關於與 API 說明 (About)
                </Link>
                <span>•</span>
                <Link
                  href="/privacy"
                  className="hover:text-amber-400 transition-colors"
                >
                  隱私權政策 (Privacy)
                </Link>
                <span>•</span>
                <Link
                  href="/terms"
                  className="hover:text-amber-400 transition-colors"
                >
                  服務條款 (Terms)
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
