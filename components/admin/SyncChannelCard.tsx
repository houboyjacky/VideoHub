"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  RefreshCw,
  Video,
  Clock,
  CheckCircle2,
  AlertCircle,
  Film,
  Sparkles,
} from "lucide-react";

interface SyncMeta {
  channelTitle?: string;
  channelId?: string;
  totalFound?: number;
  newCount?: number;
  updatedCount?: number;
  lastSyncAt?: string;
  status?: string;
}

export function SyncChannelCard({
  className = "",
  compact = false,
  onSyncComplete,
}: {
  className?: string;
  compact?: boolean;
  onSyncComplete?: () => void;
}) {
  const [meta, setMeta] = useState<SyncMeta | null>(null);
  const [channelTitle, setChannelTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/sync-channel");
      if (res.ok) {
        const data = await res.json();
        setMeta(data.meta);
        setChannelTitle(data.channelTitle || data.meta?.channelTitle || "");
      }
    } catch (e) {
      console.error("Failed to load sync status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/sync-channel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "同步失敗");
      }

      setMessage({
        text: `同步完成！頻道「${data.result.channelTitle}」共有 ${data.result.totalFound} 部影片 (新增 ${data.result.newCount} 部，更新 ${data.result.updatedCount} 部)`,
        type: "success",
      });

      await fetchStatus();
      if (onSyncComplete) onSyncComplete();
    } catch (err: any) {
      setMessage({
        text: err?.message || "同步失敗，請確認 API 金鑰或網路狀態",
        type: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatLastSync = (dateStr?: string) => {
    if (!dateStr) return "尚未執行同步";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
        {/* 上次同步時間徽章 */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>上次同步：</span>
          <span className="font-mono text-zinc-200">
            {meta?.lastSyncAt ? formatLastSync(meta.lastSyncAt) : "尚未同步"}
          </span>
        </div>

        {/* 立即同步按鈕 */}
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "同步中..." : "同步頻道"}</span>
        </button>
      </div>
    );
  }

  return (
    <GlassCard className={`p-6 border border-white/10 space-y-5 ${className}`}>
      {/* 頂部標題與狀態 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-lg shadow-red-500/10">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <span>YouTube 全頻道影片同步</span>
              {channelTitle && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 font-normal">
                  {channelTitle}
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400">
              自動同步頻道上傳之所有影片，並保留既有自訂分類
            </p>
          </div>
        </div>
      </div>

      {/* 同步狀態訊息提示 */}
      {message && (
        <div
          className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs leading-relaxed animate-fade-in ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 狀態資訊網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[11px] text-zinc-500 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>上次同步時間</span>
          </div>
          <div className="text-xs font-mono text-zinc-200">
            {meta?.lastSyncAt ? formatLastSync(meta.lastSyncAt) : "尚未執行"}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[11px] text-zinc-500 mb-1 flex items-center gap-1">
            <Film className="w-3.5 h-3.5 text-amber-400" />
            <span>頻道收錄影片總數</span>
          </div>
          <div className="text-sm font-semibold text-zinc-100">
            {meta?.totalFound !== undefined ? `${meta.totalFound} 部` : "--"}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[11px] text-zinc-500 mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>上次同步異動</span>
          </div>
          <div className="text-xs text-zinc-300">
            {meta ? (
              <span>
                新增 <strong className="text-emerald-400">+{meta.newCount || 0}</strong> / 更新 {meta.updatedCount || 0}
              </span>
            ) : (
              "--"
            )}
          </div>
        </div>
      </div>

      {/* 同步動作按鈕 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
        <div className="text-xs text-zinc-400">
          目標頻道：
          <span className="font-medium text-amber-300">
            {channelTitle ? `${channelTitle} (自動綁定)` : "自動讀取 YouTube 頻道 API"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "正在同步全頻道影片..." : "立即同步全頻道影片"}</span>
        </button>
      </div>
    </GlassCard>
  );
}
