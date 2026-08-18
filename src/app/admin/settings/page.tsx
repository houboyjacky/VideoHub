"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Settings,
  Sparkles,
  Save,
  Mail,
  Send,
  Film,
  ShieldAlert,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info,
} from "lucide-react";

interface SystemSettingsData {
  appName: string;
  adminName: string;
  contactEmail: string;
  youtubeApiKey: string;
  youtubeApiKeyMasked: string;
  youtubeChannelId: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassMasked: string;
  smtpSecure: boolean;
  emailFrom: string;
  resendApiKeyMasked: string;
  rateLimitMaxAttempts: number;
  rateLimitLockoutMinutes: number;
  isCustomized: {
    appName: boolean;
    adminName: boolean;
    contactEmail: boolean;
    youtubeApiKey: boolean;
    youtubeChannelId: boolean;
    smtp: boolean;
    resend: boolean;
  };
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 表單資料
  const [formData, setFormData] = useState({
    appName: "",
    adminName: "",
    contactEmail: "",
    youtubeApiKey: "",
    youtubeChannelId: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    smtpUser: "",
    smtpPass: "",
    smtpSecure: true,
    emailFrom: "",
    resendApiKey: "",
    rateLimitMaxAttempts: 5,
    rateLimitLockoutMinutes: 15,
  });

  // 密碼顯示狀態
  const [showYtKey, setShowYtKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);

  // 測試收件人 Email
  const [testTargetEmail, setTestTargetEmail] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok && data.settings) {
        const s: SystemSettingsData = data.settings;
        setFormData({
          appName: s.appName,
          adminName: s.adminName,
          contactEmail: s.contactEmail,
          youtubeApiKey: s.youtubeApiKeyMasked,
          youtubeChannelId: s.youtubeChannelId,
          smtpHost: s.smtpHost,
          smtpPort: s.smtpPort,
          smtpUser: s.smtpUser,
          smtpPass: s.smtpPassMasked,
          smtpSecure: s.smtpSecure,
          emailFrom: s.emailFrom,
          resendApiKey: s.resendApiKeyMasked,
          rateLimitMaxAttempts: s.rateLimitMaxAttempts,
          rateLimitLockoutMinutes: s.rateLimitLockoutMinutes,
        });
      } else {
        setError(data.error || "無法載入系統設定");
      }
    } catch (err: any) {
      setError(err.message || "載入設定失敗");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess("🎉 系統動態設定已成功儲存並即時生效！");
        fetchSettings();
      } else {
        setError(data.error || "儲存失敗");
      }
    } catch (err: any) {
      setError(err.message || "儲存設定失敗");
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testTargetEmail || !testTargetEmail.includes("@")) {
      setError("請先填寫正確的測試收件 Email");
      return;
    }

    try {
      setTestingEmail(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail: testTargetEmail }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`✉️ 測試信已成功寄出至「${testTargetEmail}」（發信引擎: ${data.provider}）`);
      } else {
        setError(`發信失敗: ${data.error || "連線逾時"}`);
      }
    } catch (err: any) {
      setError(`發信發生錯誤: ${err.message}`);
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm">正在載入系統動態設定...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 標題與簡介 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Settings className="w-6 h-6 text-amber-400" />
              系統全域動態設定
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 免重啟即時生效
            </span>
          </div>
          <p className="text-sm text-zinc-400">
            可視化管理網站品牌、YouTube 同步、郵件通知與安全防禦策略，支援留空自動回退機制。
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl glass-btn text-xs text-zinc-300 hover:text-white self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>重新整理</span>
        </button>
      </div>

      {/* 提示橫幅 */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-semibold text-amber-300">💡 智慧三層回退機制說明：</p>
          <p>
            1. 於此頁面填寫的數值將<strong>最高優先採用</strong>並即時生效。
            2. 若將任何欄位清空，系統將自動回退至 <code>.env.local</code> 環境變數或系統內建安全預設值。
            3. 機密金鑰保持 <code>••••••••</code> 遮罩狀態時代表維持原設定，絕不被誤覆蓋。
          </p>
        </div>
      </div>

      {/* 狀態訊息 */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* 區塊 1: 品牌與外觀 */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 text-white font-semibold text-base">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>網站品牌與外觀</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                平台自訂名稱 (App Name)
              </label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="例如: VideoHub"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">顯示於網頁標題、Logo 與通知信件。</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                管理員預設稱呼 (Admin Name)
              </label>
              <input
                type="text"
                value={formData.adminName}
                onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                placeholder="例如: 管理員"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">顯示於信件署名與全站動態稱謂。</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                客服與聯絡信箱 (Contact Email)
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@your-domain.com"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">顯示於頁尾、隱私權與條款說明頁面。</p>
            </div>
          </div>
        </GlassCard>

        {/* 區塊 2: YouTube 影片自動同步 */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 text-white font-semibold text-base">
            <Film className="w-5 h-5 text-red-500" />
            <span>YouTube 影片與頻道同步</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                YouTube Data API v3 Key
              </label>
              <div className="relative">
                <input
                  type={showYtKey ? "text" : "password"}
                  value={formData.youtubeApiKey}
                  onChange={(e) => setFormData({ ...formData, youtubeApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowYtKey(!showYtKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showYtKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">留空或保持遮罩代表維持原配置。</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                預設同步目標頻道 ID / @Handle / 播放清單
              </label>
              <input
                type="text"
                value={formData.youtubeChannelId}
                onChange={(e) => setFormData({ ...formData, youtubeChannelId: e.target.value })}
                placeholder="例如: UC... 或 @mychannel"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-red-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">定時排程增量抓取影片的預設來源。</p>
            </div>
          </div>
        </GlassCard>

        {/* 區塊 3: 郵件通知服務 (SMTP / Resend) */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 text-white font-semibold text-base">
            <Mail className="w-5 h-5 text-indigo-400" />
            <span>郵件通知服務 (SMTP / Resend)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                SMTP 伺服器主機 (Host)
              </label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                SMTP 連接埠 (Port)
              </label>
              <input
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: parseInt(e.target.value, 10) || 465 })}
                placeholder="465"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                寄件者抬頭 (From Address)
              </label>
              <input
                type="text"
                value={formData.emailFrom}
                onChange={(e) => setFormData({ ...formData, emailFrom: e.target.value })}
                placeholder="VideoHub <noreply@your-domain.com>"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                SMTP 帳號 / Gmail
              </label>
              <input
                type="text"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="your_email@gmail.com"
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                SMTP 應用程式密碼 (App Password)
              </label>
              <div className="relative">
                <input
                  type={showSmtpPass ? "text" : "password"}
                  value={formData.smtpPass}
                  onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* 備用 Resend API Key */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              備用 Resend API Key (選填，SMTP 失敗時自動 Fallback)
            </label>
            <div className="relative max-w-md">
              <input
                type={showResendKey ? "text" : "password"}
                value={formData.resendApiKey}
                onChange={(e) => setFormData({ ...formData, resendApiKey: e.target.value })}
                placeholder="re_..."
                className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowResendKey(!showResendKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* 郵件連線測試工具 */}
          <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-white mb-1">🧪 發送郵件連線測試信</p>
              <p className="text-[11px] text-zinc-400">
                輸入您的收件 Email，系統將嘗試使用當前設定發送一封測試信，即時驗證連線。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testTargetEmail}
                onChange={(e) => setTestTargetEmail(e.target.value)}
                placeholder="收件測試信箱..."
                className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={testingEmail}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-all shrink-0"
              >
                {testingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>寄送測試信</span>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* 區塊 4: 安全防禦與限流策略 */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 text-white font-semibold text-base">
            <ShieldAlert className="w-5 h-5 text-emerald-400" />
            <span>安全防禦與防暴力限流策略</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                邀請碼連續輸錯上限 (次)
              </label>
              <input
                type="number"
                value={formData.rateLimitMaxAttempts}
                onChange={(e) => setFormData({ ...formData, rateLimitMaxAttempts: parseInt(e.target.value, 10) || 5 })}
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">預設 5 次，達上限立即啟動安全冷卻鎖定。</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                安全冷卻鎖定時間 (分鐘)
              </label>
              <input
                type="number"
                value={formData.rateLimitLockoutMinutes}
                onChange={(e) => setFormData({ ...formData, rateLimitLockoutMinutes: parseInt(e.target.value, 10) || 15 })}
                className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              />
              <p className="text-[11px] text-zinc-500 mt-1">預設 15 分鐘，期間內對該 Session/IP 限制存取。</p>
            </div>
          </div>
        </GlassCard>

        {/* 底部儲存按鈕 */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>儲存全域動態設定</span>
          </button>
        </div>
      </form>
    </div>
  );
}
