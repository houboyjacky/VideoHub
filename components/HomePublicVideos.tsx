"use client";

import React, { useState } from "react";
import { Play, X, Calendar, Film, Lock, Sparkles, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";

interface PublicVideo {
  id: string;
  ytId: string;
  title: string;
  thumbnail: string;
  publishedAt: string | Date;
}

export function HomePublicVideos({ videos = [] }: { videos: PublicVideo[] }) {
  const [activeVideo, setActiveVideo] = useState<PublicVideo | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayedVideos = showAll ? videos : videos.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 標題列 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              精選公開影音專區 (Featured Public Videos)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            訪客與審查人員無需登入即可直接點擊試看以下公開影音內容
          </p>
        </div>

        {videos.length > 6 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl glass-btn text-xs font-semibold text-amber-300 hover:text-white transition-all"
          >
            {showAll ? "顯示精選 6 部" : `展開全部公開影片 (${videos.length})`}
          </button>
        )}
      </div>

      {/* 公開影片卡片網格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayedVideos.map((video) => {
          const dateStr = new Date(video.publishedAt).toLocaleDateString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });

          return (
            <div
              key={video.id}
              onClick={() => setActiveVideo(video)}
              className="group glass-card rounded-2xl overflow-hidden flex flex-col cursor-pointer border border-white/10 hover:border-amber-500/40 hover:scale-[1.02] transition-all duration-300 shadow-lg"
            >
              {/* 縮圖區域 */}
              <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                <img
                  src={video.thumbnail || "/cover-placeholder.svg"}
                  alt={video.title}
                  loading="lazy"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* 播放按鈕 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>

                {/* 狀態徽章 */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
                    🌐 公開免登入
                  </span>
                </div>
              </div>

              {/* 資訊區 */}
              <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
                <h3 className="font-semibold text-sm text-zinc-100 line-clamp-2 group-hover:text-amber-300 transition-colors leading-snug">
                  {video.title}
                </h3>

                <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{dateStr}</span>
                  </div>
                  <span className="text-amber-400/80 group-hover:text-amber-300 text-[11px] flex items-center gap-1">
                    點擊播放
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors shrink-0"
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
