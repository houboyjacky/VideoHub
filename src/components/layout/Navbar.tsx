import React from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Shield, LogOut, Video, Sparkles, Edit3 } from "lucide-react";
import { RedeemInviteModal } from "./RedeemInviteModal";
import { EditProfileModal } from "./EditProfileModal";

import { getAppBrandConfig } from "@/lib/application/use-cases/system-settings.usecase";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.status !== "approved") {
    return null;
  }

  const { appName } = await getAppBrandConfig();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/feed"
          className="flex items-center gap-2.5 group transition-transform hover:scale-[1.02]"
        >
          <img
            src="/logo.svg"
            alt={appName}
            className="w-8 h-8 rounded-lg shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all"
          />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {appName}
          </span>
        </Link>

        {/* Right side navigation & user profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-4 shrink-0">
          <Link
            href="/feed"
            title="影片動態"
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors whitespace-nowrap shrink-0"
          >
            <Video className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="hidden md:inline">影片動態</span>
          </Link>

          {/* 輸入邀請碼按鈕 */}
          <RedeemInviteModal />

          {user.isAdmin && (
            <Link
              href="/admin"
              title="管理後台"
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 rounded-lg transition-all shadow-sm shadow-amber-500/10 whitespace-nowrap shrink-0"
            >
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="hidden sm:inline">管理後台</span>
            </Link>
          )}

          {/* User info & Edit Profile */}
          <div className="flex items-center gap-1 sm:gap-2 pl-1.5 sm:pl-2 border-l border-white/10 shrink-0">
            <EditProfileModal
              currentName={user.name}
              email={user.email}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group text-left whitespace-nowrap shrink-0"
                  title={`點擊修改個人稱呼 (${user.name || ""})`}
                >
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-7 h-7 rounded-full border border-amber-500/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-xs font-semibold text-zinc-300 shrink-0">
                      {(user.name || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden md:inline text-xs sm:text-sm font-medium text-zinc-300 group-hover:text-amber-300 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <Edit3 className="w-3 h-3 text-zinc-500 group-hover:text-amber-300 hidden md:inline shrink-0" />
                </button>
              }
            />

            {/* Logout form */}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                title="登出"
                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
