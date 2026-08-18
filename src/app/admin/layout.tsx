import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Film,
  Layers,
  KeyRound,
  ArrowLeft,
  ShieldCheck,
  Mail,
  ScrollText,
} from "lucide-react";

import { getAppBrandConfig } from "@/lib/application/use-cases/system-settings.usecase";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/feed");
  }

  const { appName } = await getAppBrandConfig();

  const navItems = [
    { label: "儀表板總覽", href: "/admin", icon: LayoutDashboard },
    { label: "用戶審核與分組", href: "/admin/users", icon: Users },
    { label: "影片庫管理", href: "/admin/videos", icon: Film },
    { label: "分組管理", href: "/admin/groups", icon: Layers },
    { label: "邀請碼管理", href: "/admin/invite-codes", icon: KeyRound },
    { label: "郵件設定", href: "/admin/email", icon: Mail },
    { label: "系統設定", href: "/admin/settings", icon: ShieldCheck },
    { label: "活動日誌", href: "/admin/logs", icon: ScrollText },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* 頂部管理員標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {appName} 管理後台
            </h1>
            <p className="text-xs text-zinc-400">
              管理邀請碼、用戶審核、影片內容與權限分組
            </p>
          </div>
        </div>

        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white self-start sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回影片動態</span>
        </Link>
      </div>

      {/* 導航標籤列 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b border-white/5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 hover:border-amber-500/30 text-zinc-300 hover:text-white shrink-0"
            >
              <Icon className="w-4 h-4 text-amber-400" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* 內容區塊 */}
      <div>{children}</div>
    </div>
  );
}
