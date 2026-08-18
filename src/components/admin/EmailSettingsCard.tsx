"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Server,
  Key,
  RefreshCw,
  Sparkles,
} from "lucide-react";

interface EmailConfig {
  smtp: {
    configured: boolean;
    host: string;
    port: number;
    secure: boolean;
    user: string;
    passMasked: string;
    from: string;
  };
  resend: {
    configured: boolean;
    apiKeyMasked: string;
    from: string;
  };
  adminEmails: string[];
}

export function EmailSettingsCard({ className = "" }: { className?: string }) {
  const [config, setConfig] = useState<EmailConfig | null>(null);
  const [targetEmail, setTargetEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [testingProvider, setTestingProvider] = useState<"smtp" | "resend" | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    provider: "smtp" | "resend";
    message: string;
    timestamp: string;
    details?: any;
  } | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/email-settings");
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        if (!targetEmail) {
          setTargetEmail(data.currentAdminEmail || data.config.adminEmails[0] || "");
        }
      }
    } catch (err) {
      console.error("載入 Email 設定失敗:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleTestEmail = async (provider: "smtp" | "resend") => {
    if (!targetEmail) {
      alert("請輸入有效的測試目標 Email");
      return;
    }

    setTestingProvider(provider);
    setFeedback(null);

    const startTime = Date.now();
    try {
      const res = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          targetEmail: targetEmail.trim(),
        }),
      });

      const data = await res.json();
      const elapsed = Date.now() - startTime;
      const timestamp = new Date().toLocaleTimeString("zh-TW", { hour12: false });

      if (res.ok && data.success) {
        setFeedback({
          type: "success",
          provider,
          message: `${data.message} (耗時 ${elapsed}ms)`,
          timestamp,
          details: data.details,
        });
      } else {
        setFeedback({
          type: "error",
          provider,
          message: data.error || "發送測試信失敗",
          timestamp,
          details: data.details,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        provider,
        message: `請求異常: ${err.message || String(err)}`,
        timestamp: new Date().toLocaleTimeString("zh-TW", { hour12: false }),
      });
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading) {
    return (
      <GlassCard className={`p-6 border border-white/10 ${className}`}>
        <div className="flex items-center gap-3 text-zinc-400">
          <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
          <span className="text-sm">正在載入郵件伺服器配置...</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className={`p-6 border border-white/10 space-y-6 ${className}`}>
      {/* 標題與簡介 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>郵件通知設定與發送測試</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                安全遮罩保護
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              檢視 SMTP 與 Resend 伺服器連線參數，並直接發送測試信至管理員信箱。
            </p>
          </div>
        </div>

        {/* 目標收件人設定 */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-black/40 px-3 py-1.5 rounded-xl border border-white/10">
          <span className="text-xs text-zinc-400 shrink-0">測試收件：</span>
          <input
            type="email"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            placeholder="admin@gmail.com"
            className="text-xs bg-transparent text-amber-300 placeholder-zinc-600 focus:outline-none w-48 sm:w-56 font-mono"
          />
        </div>
      </div>

      {/* 雙通道設定展示卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. 主用通道：Google Gmail SMTP */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">
                  主用：Google Gmail SMTP
                </span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  config?.smtp.configured
                    ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {config?.smtp.configured ? "● 已配置" : "○ 未設定"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">主機端口</span>
                <span className="text-zinc-200">
                  {config?.smtp.host}:{config?.smtp.port}{" "}
                  {config?.smtp.secure && "(SSL)"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">發信帳號</span>
                <span className="text-amber-300">{config?.smtp.user}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">應用程式密碼</span>
                <span className="text-zinc-400 tracking-wider">
                  {config?.smtp.passMasked}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">寄件人格式</span>
                <span className="text-zinc-300 truncate max-w-[200px]">
                  {config?.smtp.from}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleTestEmail("smtp")}
            disabled={testingProvider !== null || !config?.smtp.configured}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-500/10"
          >
            {testingProvider === "smtp" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>正在發送 Google SMTP 測試信...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>發送 Google SMTP 測試信</span>
              </>
            )}
          </button>
        </div>

        {/* 2. 備用通道：Resend REST API */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-semibold text-white">
                  備用：Resend REST API (SDK)
                </span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  config?.resend.configured
                    ? "bg-sky-500/10 border border-sky-500/30 text-sky-400"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {config?.resend.configured ? "● 已配置" : "○ 未設定"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-zinc-300 font-mono">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">API Key</span>
                <span className="text-sky-300 tracking-wider">
                  {config?.resend.apiKeyMasked}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">發信位址</span>
                <span className="text-zinc-300 truncate max-w-[200px]">
                  {config?.resend.from}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-zinc-500">備用機制</span>
                <span className="text-zinc-400">SMTP 故障時自動 Fallback</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">連線模式</span>
                <span className="text-zinc-300">HTTPS REST API</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleTestEmail("resend")}
            disabled={testingProvider !== null || !config?.resend.configured}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 border border-sky-500/40 text-sky-300 hover:text-sky-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-sky-500/10"
          >
            {testingProvider === "resend" ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>正在發送 Resend API 測試信...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>發送 Resend API 測試信</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 測試結果診斷反饋面板 */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between gap-3 text-xs animate-fade-in ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-sm">
                {feedback.type === "success"
                  ? `[${feedback.provider.toUpperCase()}] 測試信發送成功！`
                  : `[${feedback.provider.toUpperCase()}] 發送失敗`}
              </div>
              <p className="text-zinc-300 font-mono text-[11px] leading-relaxed">
                {feedback.message}
              </p>
              {feedback.details && (
                <div className="text-[10px] text-zinc-500 font-mono mt-1">
                  詳細回應: {JSON.stringify(feedback.details)}
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 self-end sm:self-auto shrink-0 font-mono">
            {feedback.timestamp}
          </span>
        </div>
      )}
    </GlassCard>
  );
}
