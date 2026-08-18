import React from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Shield, LogOut, Video, Sparkles } from "lucide-react";
import { RedeemInviteModal } from "./RedeemInviteModal";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.status !== "approved") {
    return null;
  }

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
            alt={process.env.NEXT_PUBLIC_APP_NAME || "VideoHub"}
            className="w-8 h-8 rounded-lg shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all"
          />
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {process.env.NEXT_PUBLIC_APP_NAME || "VideoHub"}
          </span>
        </Link>

        {/* Right side navigation & user profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/feed"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <Video className="w-4 h-4 text-amber-400" />
            <span>影片動態</span>
          </Link>

          {/* 輸入邀請碼按鈕 */}
          <RedeemInviteModal />

          {user.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 rounded-lg transition-all shadow-sm shadow-amber-500/10"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>管理後台</span>
            </Link>
          )}

          {/* User info */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={user.name || "User"}
                className="w-7 h-7 rounded-full border border-amber-500/40 object-cover"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-white/20 flex items-center justify-center text-xs font-semibold text-zinc-300">
                {(user.name || "U")[0].toUpperCase()}
              </div>
            )}
            <span className="hidden md:inline text-xs sm:text-sm font-medium text-zinc-300 truncate max-w-[120px]">
              {user.name}
            </span>

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
                className="p-1.5 text-zinc-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
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
