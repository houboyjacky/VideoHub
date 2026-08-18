import React from "react";
import { EmailSettingsCard } from "@/components/admin/EmailSettingsCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Mail, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

export default function AdminEmailSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* 頁面標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              郵件通知與伺服器設定
            </h2>
            <p className="text-xs text-zinc-400">
              檢視系統 SMTP / Resend 連線狀態、進行獨立發信測試與郵件運作機制說明
            </p>
          </div>
        </div>
      </div>

      {/* 主設定與測試卡片 */}
      <EmailSettingsCard />

      {/* 郵件通知觸發時機與機制說明 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3>系統自動發信時機</h3>
          </div>
          <div className="space-y-3 text-xs text-zinc-300">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="font-semibold text-emerald-300">🎉 會員審核通過通知</div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                當管理員在「用戶審核」點擊「通過」時，系統自動發送包含登入連結的歡迎通知信，引導朋友直接登入觀看專屬影片。
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
              <div className="font-semibold text-amber-300">📝 會員申請結果通知</div>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                當管理員在「用戶審核」點擊「拒絕」時，系統自動發送禮貌性申請結果通知。
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border border-white/10 space-y-4">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <ShieldAlert className="w-4 h-4 text-sky-400" />
            <h3>雙通道自動容錯機制 (High Availability)</h3>
          </div>
          <div className="space-y-3 text-xs text-zinc-300">
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              為確保註冊會員能 100% 收到驗證與開通信件，系統採用雙引擎架構：
            </p>
            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex gap-2">
                <span className="font-semibold text-emerald-400 shrink-0">第一優先：</span>
                <span className="text-zinc-300">Google Gmail SMTP（高送達率、真實寄件人識別）。</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex gap-2">
                <span className="font-semibold text-sky-400 shrink-0">第二備援：</span>
                <span className="text-zinc-300">Resend REST API SDK（若 Google SMTP 限流或逾時，自動瞬間 Fallback）。</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex gap-2">
                <span className="font-semibold text-amber-400 shrink-0">密鑰安全：</span>
                <span className="text-zinc-300">密碼與 API Key 受環境變數保護，前端介面自動進行遮罩。</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
