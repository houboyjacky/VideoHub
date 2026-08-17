import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { SyncChannelCard } from "@/components/admin/SyncChannelCard";
import {
  Users,
  UserCheck,
  UserX,
  Film,
  Layers,
  KeyRound,
  ArrowRight,
  Clock,
  Sparkles,
  Mail,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const [
    pendingCount,
    approvedCount,
    rejectedCount,
    videoCount,
    groupCount,
    inviteCount,
  ] = await Promise.all([
    prisma.user.count({ where: { status: "pending" } }),
    prisma.user.count({ where: { status: "approved" } }),
    prisma.user.count({ where: { status: "rejected" } }),
    prisma.video.count({ where: { deleted: false } }),
    prisma.group.count(),
    prisma.inviteCode.count({ where: { disabled: false } }),
  ]);

  const stats = [
    {
      title: "待審核用戶",
      value: pendingCount,
      icon: Clock,
      href: "/admin/users?status=pending",
      highlight: pendingCount > 0,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      title: "已核准用戶",
      value: approvedCount,
      icon: UserCheck,
      href: "/admin/users?status=approved",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      title: "影片總數",
      value: videoCount,
      icon: Film,
      href: "/admin/videos",
      color: "text-sky-400",
      bg: "bg-sky-500/10",
      border: "border-sky-500/30",
    },
    {
      title: "影片分組數",
      value: groupCount,
      icon: Layers,
      href: "/admin/groups",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    },
    {
      title: "有效邀請碼",
      value: inviteCount,
      icon: KeyRound,
      href: "/admin/invite-codes",
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/30",
    },
    {
      title: "已拒絕申請",
      value: rejectedCount,
      icon: UserX,
      href: "/admin/users?status=rejected",
      color: "text-zinc-400",
      bg: "bg-zinc-500/10",
      border: "border-zinc-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      {/* 待審核提醒 Banner (若有待審核用戶) */}
      {pendingCount > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">
                有 {pendingCount} 位朋友正在等待加入審核
              </h2>
              <p className="text-xs text-zinc-400">
                審核通過後系統將自動發送 Email 通知並分配分組權限。
              </p>
            </div>
          </div>

          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-xl glass-btn-primary text-xs font-semibold shrink-0"
          >
            前往審核
          </Link>
        </div>
      )}

      {/* 數據統計卡片網格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.title} href={item.href} className="group">
              <GlassCard
                className={`p-5 flex flex-col justify-between h-full border ${
                  item.highlight
                    ? "border-amber-500/40 bg-amber-500/[0.04]"
                    : "border-white/5"
                } group-hover:border-amber-500/40 transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-9 h-9 rounded-xl ${item.bg} ${item.border} flex items-center justify-center ${item.color}`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white font-mono">
                    {item.value}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">{item.title}</div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>

      {/* YouTube 全頻道自動同步卡片 */}
      <SyncChannelCard />

      {/* 快捷操作面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3>快捷操作</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link
              href="/admin/videos"
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 text-xs font-medium text-zinc-200 hover:text-white flex flex-col gap-1 transition-all"
            >
              <Film className="w-4 h-4 text-sky-400 mb-1" />
              <span>新增 YouTube 影片</span>
              <span className="text-[11px] text-zinc-500">輸入網址自動補全</span>
            </Link>

            <Link
              href="/admin/invite-codes"
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 text-xs font-medium text-zinc-200 hover:text-white flex flex-col gap-1 transition-all"
            >
              <KeyRound className="w-4 h-4 text-pink-400 mb-1" />
              <span>建立新邀請碼</span>
              <span className="text-[11px] text-zinc-500">自訂次數與效期</span>
            </Link>

            <Link
              href="/admin/groups"
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 text-xs font-medium text-zinc-200 hover:text-white flex flex-col gap-1 transition-all"
            >
              <Layers className="w-4 h-4 text-purple-400 mb-1" />
              <span>建立影片分組</span>
              <span className="text-[11px] text-zinc-500">依好友群分類影片</span>
            </Link>

            <Link
              href="/admin/users"
              className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-amber-500/30 text-xs font-medium text-zinc-200 hover:text-white flex flex-col gap-1 transition-all"
            >
              <Users className="w-4 h-4 text-emerald-400 mb-1" />
              <span>分配用戶權限</span>
              <span className="text-[11px] text-zinc-500">指派用戶所屬分組</span>
            </Link>

            <Link
              href="/admin/email"
              className="col-span-2 p-3.5 rounded-xl bg-amber-500/[0.04] hover:bg-amber-500/[0.08] border border-amber-500/20 hover:border-amber-500/40 text-xs font-medium text-amber-200 hover:text-white flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">郵件通知與伺服器設定</div>
                  <div className="text-[11px] text-zinc-400">檢視 SMTP / Resend 配置與發送測試信</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-base">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3>系統資訊與定期維護</h3>
          </div>
          <div className="space-y-3 text-xs text-zinc-400 pt-2">
            <div className="flex justify-between py-2 border-b border-white/5">
              <span>域名設定</span>
              <span className="font-mono text-zinc-200">{process.env.NEXTAUTH_URL ? new URL(process.env.NEXTAUTH_URL).host : "已設定"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span>服務 Port</span>
              <span className="font-mono text-zinc-200">{process.env.PORT || "3000"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span>資料庫狀態</span>
              <span className="font-mono text-emerald-400">● 正常連線 (Connected)</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/5">
              <span>YouTube 同步排程</span>
              <span className="text-zinc-200">每日凌晨 02:00 自動更新</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
