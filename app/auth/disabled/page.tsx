import React from "react";
import { signOut } from "@/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { UserX, LogOut } from "lucide-react";
import { getAdminDisplayName } from "@/lib/admin-helper";

export const dynamic = "force-dynamic";

export default async function DisabledPage() {
  const adminName = await getAdminDisplayName();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md text-center">
        <GlassCard className="border border-red-500/20 shadow-2xl backdrop-blur-2xl p-8 bg-zinc-950/70">
          {/* Status Icon */}
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
            <UserX className="w-8 h-8 text-red-400" />
          </div>

          {/* Title & Message */}
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">
            帳號已被停用
          </h1>

          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            您的帳號存取權限已被管理員暫停。若您認為這是誤判或需要重新啟用存取權限，請直接與{" "}
            <span className="text-amber-400 font-semibold">{adminName}</span> 聯繫。
          </p>

          {/* SignOut Button */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl glass-btn flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white hover:border-red-500/40 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>返回首頁並登出</span>
            </button>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}
