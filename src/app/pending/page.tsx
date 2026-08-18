import React from "react";
import { auth, signOut } from "@/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { getAdminDisplayName } from "@/lib/admin-helper";

export default async function PendingPage() {
  const session = await auth();
  const user = session?.user;
  const status = user?.status || "pending";
  const isRejected = status === "rejected";
  const isApproved = status === "approved";
  const adminName = await getAdminDisplayName();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md text-center">
        <GlassCard className="border border-white/10 shadow-2xl backdrop-blur-2xl p-8">
          {/* Status Icon */}
          {isApproved ? (
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          ) : isRejected ? (
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6 relative">
              <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>
          )}

          {/* Title & Message */}
          <h1 className="text-xl font-bold tracking-tight text-white mb-2">
            {isApproved
              ? "審核已通過！"
              : isRejected
              ? "申請未獲核准"
              : "申請審核中"}
          </h1>

          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {isApproved ? (
              "您的申請已經核准，現在可以開始觀看影片。"
            ) : isRejected ? (
              `很抱歉，您的存取申請目前未獲通過。若有任何疑問，請直接與 ${adminName} 聯繫。`
            ) : (
              <>
                嗨 <span className="text-zinc-200 font-medium">{user?.name || "朋友"}</span>，您的加入申請已送出！管理員正在進行手動審核，通過後將會發送 Email 通知您。
              </>
            )}
          </p>

          {/* User badge */}
          <div className="py-2.5 px-4 rounded-xl bg-white/[0.03] border border-white/5 inline-flex items-center gap-2 mb-8 text-xs text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-amber-400/80"></span>
            <span>帳號：{user?.email}</span>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isApproved ? (
              <Link
                href="/feed"
                className="w-full py-3 rounded-xl glass-btn-primary flex items-center justify-center gap-2 text-sm font-semibold"
              >
                進入影片動態
              </Link>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl glass-btn flex items-center justify-center gap-2 text-xs sm:text-sm font-medium text-zinc-400 hover:text-zinc-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>登出帳號</span>
                </button>
              </form>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
