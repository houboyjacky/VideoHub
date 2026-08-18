"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  ScrollText,
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  UserPlus,
  ShieldAlert,
  Laptop,
  Smartphone,
  Globe,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Monitor,
  Apple,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ActivityLogItem {
  id: string;
  userId?: string | null;
  email: string;
  name?: string | null;
  image?: string | null;
  action: string;
  status: string;
  os?: string | null;
  browser?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  details?: string | null;
  createdAt: string;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("all");

  const fetchLogs = async (query = searchQuery, action = selectedAction, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else if (query.trim()) setSearching(true);
      else setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      if (action && action !== "all") params.set("action", action);
      params.set("limit", query.trim() ? "500" : "50");

      const res = await fetch(`/api/admin/logs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "無法取得活動日誌");
      setLogs(data.logs || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSearching(false);
    }
  };

  // 1. 切換動作篩選時立即重查
  useEffect(() => {
    fetchLogs(searchQuery, selectedAction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAction]);

  // 2. 搜尋關鍵字防抖直查資料庫 (350ms Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs(searchQuery, selectedAction);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const filteredLogs = logs;

  // 格式化相對時間
  const formatRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "剛剛";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} 分鐘前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 小時前`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} 天前`;
    return new Date(dateStr).toLocaleDateString("zh-TW");
  };

  // 作業系統圖示與樣式
  const getOsBadge = (osName?: string | null) => {
    const os = osName || "未知系統";
    if (/windows/i.test(os)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 border border-sky-500/20 text-xs font-mono">
          <Monitor className="w-3.5 h-3.5 text-sky-400" />
          <span>{os}</span>
        </span>
      );
    }
    if (/macos|ios|ipad/i.test(os)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-200/10 text-zinc-200 border border-white/20 text-xs font-mono">
          <Apple className="w-3.5 h-3.5 text-zinc-300" />
          <span>{os}</span>
        </span>
      );
    }
    if (/android/i.test(os)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>{os}</span>
        </span>
      );
    }
    if (/linux/i.test(os)) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono">
          <Laptop className="w-3.5 h-3.5 text-amber-400" />
          <span>{os}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-400 border border-white/10 text-xs font-mono">
        <Globe className="w-3.5 h-3.5" />
        <span>{os}</span>
      </span>
    );
  };

  // 動作類型徽章
  const getActionBadge = (action: string, status: string) => {
    const isFailed = status === "failed";

    if (action === "login") {
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
            isFailed
              ? "bg-red-500/10 text-red-300 border-red-500/20"
              : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
          }`}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{isFailed ? "登入失敗" : "登入"}</span>
        </span>
      );
    }

    if (action === "logout") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-xs font-medium">
          <LogOut className="w-3.5 h-3.5" />
          <span>登出</span>
        </span>
      );
    }

    if (action === "register") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-medium">
          <UserPlus className="w-3.5 h-3.5 text-amber-400" />
          <span>提交註冊</span>
        </span>
      );
    }

    if (action === "approve") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>審核通過</span>
        </span>
      );
    }

    if (action === "reject") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 text-xs font-medium">
          <XCircle className="w-3.5 h-3.5" />
          <span>拒絕申請</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-zinc-300 border border-white/10 text-xs font-medium">
        <Sparkles className="w-3.5 h-3.5" />
        <span>{action}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 頁面標題與操作列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ScrollText className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              系統活動日誌 (Activity Logs)
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>自動循環保留最新 50 筆</span>
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            永久追蹤記錄使用者登入、登出、註冊申請、兌換與管理員審核紀錄。系統採用自動循環保留機制（恆定嚴格保留最新 50 筆），防篡改且不可手動清空。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchLogs(searchQuery, selectedAction, true)}
            disabled={loading || refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
            title="重新整理日誌"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            <span>重新整理</span>
          </button>
        </div>
      </div>

      {/* 狀態訊息橫幅 */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 搜尋與篩選列 */}
      <GlassCard className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* 搜尋框 */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="從資料庫即時搜尋 Email、姓名、IP、作業系統或說明 (不限 50 筆)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs p-1 cursor-pointer"
                title="清除搜尋"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* 動作類型篩選按鈕組 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "全部" },
              { id: "login", label: "登入" },
              { id: "logout", label: "登出" },
              { id: "register", label: "註冊申請" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedAction(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedAction === tab.id
                    ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/5 animate-fade-in">
            <span>
              🔍 資料庫即時搜尋：找到 <strong className="text-amber-400 font-semibold">{logs.length}</strong> 筆相符歷史紀錄
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer text-[11px]"
            >
              ✕ 清除搜尋並顯示最新 50 筆
            </button>
          </div>
        )}
      </GlassCard>

      {/* 日誌表格清單 */}
      <GlassCard className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-zinc-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
            <p className="text-xs">正在載入活動日誌...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400 space-y-2">
            <ScrollText className="w-8 h-8 mx-auto text-zinc-600 mb-1" />
            <p className="text-sm font-medium text-zinc-300">查無相關活動日誌</p>
            <p className="text-xs text-zinc-500">
              {searchQuery ? "找不到符合關鍵字的紀錄，請嘗試不同關鍵字。" : "目前系統尚無任何登入或操作紀錄。"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.03] border-b border-white/10 text-zinc-400 font-medium">
                <tr>
                  <th className="py-3.5 px-4">使用者資訊</th>
                  <th className="py-3.5 px-4">動作類型</th>
                  <th className="py-3.5 px-4">作業系統 (OS)</th>
                  <th className="py-3.5 px-4">瀏覽器 / IP</th>
                  <th className="py-3.5 px-4">詳細說明</th>
                  <th className="py-3.5 px-4 text-right">時間</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* 使用者資訊 */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {log.image ? (
                          <img
                            src={log.image}
                            alt={log.name || "User"}
                            className="w-8 h-8 rounded-full border border-white/10 object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-400 shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate max-w-[140px] sm:max-w-[180px]">
                            {log.name || "未命名用戶"}
                          </p>
                          <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[140px] sm:max-w-[180px]">
                            {log.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 動作類型徽章 */}
                    <td className="py-3 px-4 shrink-0 whitespace-nowrap">
                      {getActionBadge(log.action, log.status)}
                    </td>

                    {/* 作業系統 */}
                    <td className="py-3 px-4 shrink-0 whitespace-nowrap">
                      {getOsBadge(log.os)}
                    </td>

                    {/* 瀏覽器 / IP */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-zinc-300 font-mono text-[11px] block">
                          {log.browser || "其他瀏覽器"}
                        </span>
                        <span className="text-zinc-500 font-mono text-[10px] block">
                          {log.ip || "127.0.0.1"}
                        </span>
                      </div>
                    </td>

                    {/* 詳細說明 */}
                    <td className="py-3 px-4 text-zinc-300">
                      <span className="text-xs">{log.details || "—"}</span>
                    </td>

                    {/* 時間 */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="text-amber-400 font-medium text-xs block font-mono">
                          {formatRelativeTime(log.createdAt)}
                        </span>
                        <span className="text-zinc-500 text-[10px] block font-mono">
                          {new Date(log.createdAt).toLocaleString("zh-TW", {
                            month: "numeric",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 底部摘要 */}
        {!loading && filteredLogs.length > 0 && (
          <div className="py-3 px-4 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-[11px] text-zinc-500">
            <span>顯示最新 {filteredLogs.length} 筆活動紀錄</span>
            <span>日誌依時間降冪即時排序</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
