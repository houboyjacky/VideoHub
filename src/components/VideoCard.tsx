/* eslint-disable @next/next/no-img-element */
import React from "react";
import Link from "next/link";
import { Play, Calendar, Tag, Layers } from "lucide-react";

export interface VideoCardData {
  id: string;
  ytId: string;
  title: string;
  thumbnail: string;
  publishedAt: string | Date;
  shootingDate?: string | Date | null;
  groupNames?: string[];
  tags?: string[];
  ytPrivacyStatus?: string;
}

interface VideoCardProps {
  video: VideoCardData;
  onTagClick?: (tag: string) => void;
}

export function VideoCard({ video, onTagClick }: VideoCardProps) {
  // 優先顯示拍攝日期，若無則顯示上傳日期
  const displayDate = video.shootingDate
    ? new Date(video.shootingDate).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : new Date(video.publishedAt).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

  const isShootingDate = !!video.shootingDate;

  return (
    <div className="group glass-card rounded-2xl overflow-hidden flex flex-col h-full hover:scale-[1.015] transition-all duration-300">
      {/* 縮圖區域 */}
      <Link
        href={`/video/${video.id}`}
        className="relative aspect-video w-full overflow-hidden bg-zinc-900 block"
      >
        <img
          src={video.thumbnail || "/images/default-thumbnail.jpg"}
          alt={video.title}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/default-thumbnail.jpg";
          }}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
        />

        {/* 黑色覆蓋漸變 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

        {/* 播放按鈕圖示 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/80 backdrop-blur-md text-black flex items-center justify-center shadow-lg shadow-amber-500/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* 隱私狀態徽章 */}
        {video.ytPrivacyStatus && video.ytPrivacyStatus !== "public" && (
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-amber-300">
            {video.ytPrivacyStatus === "unlisted" ? "不公開" : "私人"}
          </div>
        )}
      </Link>

      {/* 內容資訊 */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* 日期與分組徽章 */}
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <span
              className="flex items-center gap-1 font-mono"
              title={isShootingDate ? "拍攝日期" : "上傳日期"}
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>{displayDate}</span>
              {isShootingDate && (
                <span className="text-[10px] text-amber-400/80 bg-amber-500/10 px-1 rounded">
                  拍攝
                </span>
              )}
            </span>

            {video.groupNames && video.groupNames.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-amber-300/90 font-medium">
                <Layers className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[120px]">
                  {video.groupNames.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* 標題 */}
          <Link href={`/video/${video.id}`}>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
              {video.title}
            </h2>
          </Link>
        </div>

        {/* 主題標籤 Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
            {video.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onTagClick?.(tag);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/[0.04] hover:bg-amber-500/20 border border-white/5 hover:border-amber-500/30 text-[11px] text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <Tag className="w-2.5 h-2.5 text-zinc-500" />
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoCard;
