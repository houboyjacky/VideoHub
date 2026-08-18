/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo } from "react";
import {
  Play,
  X,
  Calendar,
  Film,
  Lock,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface PublicVideo {
  id: string;
  ytId: string;
  title: string;
  thumbnail: string;
  publishedAt: string | Date;
  shootingDate?: string | Date | null;
}

// 核心時間萃取函式：優先取得拍攝時間 (shootingDate)，若無拍攝時間則取出發布/上傳時間 (publishedAt)
function getEffectiveTimestamp(v: {
  shootingDate?: string | Date | null;
  publishedAt?: string | Date | null;
}): number {
  if (v.shootingDate) {
    const t = new Date(v.shootingDate).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (v.publishedAt) {
    const t = new Date(v.publishedAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  return 0;
}

export function HomePublicVideos({ videos = [] }: { videos: PublicVideo[] }) {
  const [activeVideo, setActiveVideo] = useState<PublicVideo | null>(null);
  const [showAll, setShowAll] = useState(false);

  // 排序模式：預設由新到舊 ("desc")，支援切換為由舊到新 ("asc")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // 依時間排序 (優先拍攝時間，若無則依發布/上傳時間)
  const sortedVideos = useMemo(() => {
    return [...videos].sort((a, b) => {
      const timeA = getEffectiveTimestamp(a);
      const timeB = getEffectiveTimestamp(b);
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [videos, sortOrder]);

  const displayedVideos = showAll ? sortedVideos : sortedVideos.slice(0, 6);

  // 分流為左右兩欄 (用於雙欄交錯時間軸)
  const leftColumnVideos = useMemo(() => {
    return displayedVideos.filter((_, idx) => idx % 2 === 0);
  }, [displayedVideos]);

  const rightColumnVideos = useMemo(() => {
    return displayedVideos.filter((_, idx) => idx % 2 === 1);
  }, [displayedVideos]);

  // 單張時間軸卡片渲染函式
  const renderTimelineCard = (video: PublicVideo, isLeft: boolean, index: number) => {
    const rawDate = video.shootingDate || video.publishedAt;
    const dateObj = rawDate ? new Date(rawDate) : null;
    const displayDate = dateObj
      ? dateObj.toLocaleDateString("zh-TW", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
      : "未知日期";
    const isShooting = !!video.shootingDate;
    const isFirstFeatured = index === 0;

    return (
      <div key={video.id} className="relative group">
        {/* 橫向延伸連接線與中央軸心節點 (桌面版) */}
        {/* 左欄卡片：向右延伸至中軸 */}
        {isLeft && (
          <div className="hidden md:block absolute -right-6 lg:-right-8 top-8 w-6 lg:w-8 h-0.5 bg-gradient-to-r from-amber-500/80 to-amber-500/30 z-10">
            <div
              className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#0a0a0f] border-2 border-amber-400 flex items-center justify-center ${
                isFirstFeatured
                  ? "shadow-[0_0_12px_rgba(245,158,11,1)] ring-2 ring-amber-400/50"
                  : "shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
          </div>
        )}

        {/* 右欄卡片：向左延伸至中軸 */}
        {!isLeft && (
          <div className="hidden md:block absolute -left-6 lg:-left-8 top-8 w-6 lg:w-8 h-0.5 bg-gradient-to-l from-amber-500/80 to-amber-500/30 z-10">
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#0a0a0f] border-2 border-amber-400 flex items-center justify-center ${
                isFirstFeatured
                  ? "shadow-[0_0_12px_rgba(245,158,11,1)] ring-2 ring-amber-400/50"
                  : "shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              }`}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
          </div>
        )}

        {/* 行動版：向左延伸至左側軸線 */}
        <div className="md:hidden absolute -left-7 top-8 w-7 h-0.5 bg-gradient-to-l from-amber-500/80 to-amber-500/30 z-10">
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0a0a0f] border-2 border-amber-400 ${
              isFirstFeatured
                ? "shadow-[0_0_12px_rgba(245,158,11,1)] ring-2 ring-amber-400/50"
                : "shadow-[0_0_8px_rgba(245,158,11,0.8)]"
            }`}
          />
        </div>

        {/* 影片卡片主體 */}
        <div
          onClick={() => setActiveVideo(video)}
          className={`group glass-card rounded-2xl overflow-hidden transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/20 cursor-pointer ${
            isFirstFeatured
              ? "border-2 border-amber-500/60 shadow-[0_0_24px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30"
              : "border border-white/10 hover:border-amber-500/50"
          }`}
        >
          {/* 拍攝時間與狀態 (影片上方) */}
          <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-mono text-amber-300 font-bold">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayDate}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans font-normal">
                {isShooting ? "拍攝" : "發布"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isFirstFeatured && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>精選推薦</span>
                </span>
              )}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                🌐 公開試看
              </span>
            </div>
          </div>

          {/* 影片縮圖 (16:9) */}
          <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
            <img
              src={video.thumbnail || "/images/default-thumbnail.jpg"}
              alt={video.title}
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/images/default-thumbnail.jpg";
              }}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/40 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                <Play className="w-5 h-5 fill-current ml-0.5" />
              </div>
            </div>
          </div>

          {/* 標題區 */}
          <div className="p-4 space-y-2">
            <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
              {video.title}
            </h3>
            <div className="text-[11px] text-amber-400/80 group-hover:text-amber-300 flex items-center gap-1 font-medium">
              <span>▶ 點擊立即線上播放</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 標題列與控制項 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              精選公開影音時間軸 (Featured Public Videos)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            訪客與審查人員無需登入即可直接點擊試看以下公開影音內容
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 由新到舊 / 由舊到新 排序切換 */}
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition-all font-medium text-xs cursor-pointer shadow-sm"
            title="切換時間排序"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === "desc" ? "📅 由新到舊" : "📅 由舊到新"}</span>
          </button>
        </div>
      </div>

      {/* 🌟 單一極簡時間軸佈局 (中央時間軸 + 雙欄左右交錯緊湊排列) */}
      <div className="relative py-4">
        {/* 中央縱向時間軸線 (桌面版置中，行動版靠左) */}
        <div className="absolute left-3.5 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-500/70 via-amber-500/30 to-amber-500/5 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />

        {/* 雙欄交錯佈局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 md:pl-0">
          {/* 左欄影片 (偶數項) */}
          <div className="space-y-6 md:pr-6 lg:pr-8">
            {leftColumnVideos.map((video, idx) =>
              renderTimelineCard(video, true, idx * 2)
            )}
          </div>

          {/* 右欄影片 (奇數項，適度頂部偏移達成左右交錯) */}
          <div className="space-y-6 md:pl-6 lg:pl-8 md:pt-16 lg:pt-20">
            {rightColumnVideos.map((video, idx) =>
              renderTimelineCard(video, false, idx * 2 + 1)
            )}
          </div>
        </div>
      </div>

      {/* 展開更多公開影片按鈕（超過 6 部時顯示） */}
      {videos.length > 6 && (
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass-btn text-xs sm:text-sm font-bold text-amber-300 hover:text-white border-amber-500/30 hover:border-amber-500/60 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer hover:scale-[1.02]"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>收合公開影片清單（精選 6 部）</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>展開更多公開影片（還有 {videos.length - 6} 部）</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 鎖定提示卡片：解鎖好友專屬影片 */}
      <GlassCard className="p-5 sm:p-6 border border-amber-500/30 bg-amber-500/[0.03] flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              想要觀看更多好友專屬或不公開活動影片？
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              使用 Google 帳號登入並填寫邀請碼，經審核後即可解鎖專屬社交圈的私有影音動態！
            </p>
          </div>
        </div>

        <a
          href="#login-section"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs shrink-0 transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02]"
        >
          立即登入申請存取
        </a>
      </GlassCard>

      {/* 彈出式 YouTube 播放 Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0e0e15] border border-white/10 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6">
            {/* Modal 頂部標題與關閉按鈕 */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-white/10">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeVideo.title}
              </h3>
              <button
                onClick={() => setActiveVideo(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* YouTube Player Iframe (無任何暗角或內陰影) */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/5">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideo.ytId}?autoplay=1&rel=0`}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0 block"
              />
            </div>

            {/* Modal 底部資訊 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  YouTube 官方播放器安全串流
                </span>
                <span>ID: {activeVideo.ytId}</span>
              </div>
              <a
                href={`https://youtu.be/${activeVideo.ytId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 self-start sm:self-auto"
              >
                <span>在 YouTube 上開啟</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
