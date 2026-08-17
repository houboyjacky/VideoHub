/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { GroupFilterBar, GroupItem } from "@/components/GroupFilterBar";
import { SearchBar } from "@/components/SearchBar";
import { TagFilterChips } from "@/components/TagFilterChips";
import {
  Film,
  SearchX,
  Calendar,
  ChevronDown,
  ArrowUpDown,
  LayoutGrid,
  GitCommit,
  Layers,
  Play,
  Tag,
} from "lucide-react";

interface FeedClientProps {
  initialVideos: VideoCardData[];
  groups: GroupItem[];
  allTags: string[];
}

const PAGE_SIZE = 12; // 預設單頁載入筆數

export function FeedClient({
  initialVideos,
  groups,
  allTags,
}: FeedClientProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 排序模式：預設由新到舊 ("desc")，支援切換為由舊到新 ("asc")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // 檢視模式：預設時間軸模式 ("timeline")，支援切換網格 ("grid")
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");

  // 分頁可視數量 (預設 12 筆)
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // 條件變更時自動重設分頁筆數
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedGroupId, selectedYear, selectedTag, searchQuery, sortOrder]);

  // 年份動態統計
  const yearStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of initialVideos) {
      const date = v.shootingDate
        ? new Date(v.shootingDate)
        : v.publishedAt
        ? new Date(v.publishedAt)
        : null;
      if (date && !isNaN(date.getTime())) {
        const y = date.getFullYear().toString();
        map.set(y, (map.get(y) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, count]) => ({ year, count }));
  }, [initialVideos]);

  // 前端即時多重交集過濾與排序
  const filteredVideos = useMemo(() => {
    const filtered = initialVideos.filter((video) => {
      // 1. 分組過濾
      if (selectedGroupId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gids = (video as any).groupIds || [];
        if (!gids.includes(selectedGroupId)) {
          return false;
        }
      }

      // 2. 年份過濾
      if (selectedYear) {
        const date = video.shootingDate
          ? new Date(video.shootingDate)
          : video.publishedAt
          ? new Date(video.publishedAt)
          : null;
        if (
          !date ||
          isNaN(date.getTime()) ||
          date.getFullYear().toString() !== selectedYear
        ) {
          return false;
        }
      }

      // 3. 標籤過濾
      if (selectedTag) {
        if (!video.tags || !video.tags.includes(selectedTag)) {
          return false;
        }
      }

      // 4. 關鍵字搜尋 (比對標題與標籤)
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = video.title.toLowerCase().includes(q);
        const inTags =
          video.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!inTitle && !inTags) {
          return false;
        }
      }

      return true;
    });

    // 依拍攝日期或發布日期排序 (預設 desc 由新到舊，支援 asc 由舊到新)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.shootingDate || a.publishedAt).getTime();
      const timeB = new Date(b.shootingDate || b.publishedAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [
    initialVideos,
    selectedGroupId,
    selectedYear,
    selectedTag,
    searchQuery,
    sortOrder,
  ]);

  // 當前分頁顯示之影片
  const displayedVideos = useMemo<VideoCardData[]>(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  // 分流為左右兩欄 (用於雙欄交錯時間軸)
  const leftColumnVideos = useMemo<VideoCardData[]>(() => {
    return displayedVideos.filter((_video: VideoCardData, idx: number) => idx % 2 === 0);
  }, [displayedVideos]);

  const rightColumnVideos = useMemo<VideoCardData[]>(() => {
    return displayedVideos.filter((_video: VideoCardData, idx: number) => idx % 2 === 1);
  }, [displayedVideos]);

  // 單張時間軸卡片渲染函式
  const renderTimelineCard = (video: VideoCardData, isLeft: boolean) => {
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

    return (
      <div key={video.id} className="relative group">
        {/* 橫向延伸連接線與中央軸心節點 (桌面版) */}
        {/* 左欄卡片：向右延伸至中軸 */}
        {isLeft && (
          <div className="hidden md:block absolute -right-6 lg:-right-8 top-8 w-6 lg:w-8 h-0.5 bg-gradient-to-r from-amber-500/80 to-amber-500/30 z-10">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#0a0a0f] border-2 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
          </div>
        )}

        {/* 右欄卡片：向左延伸至中軸 */}
        {!isLeft && (
          <div className="hidden md:block absolute -left-6 lg:-left-8 top-8 w-6 lg:w-8 h-0.5 bg-gradient-to-l from-amber-500/80 to-amber-500/30 z-10">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#0a0a0f] border-2 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            </div>
          </div>
        )}

        {/* 行動版：向左延伸至左側軸線 */}
        <div className="md:hidden absolute -left-7 top-8 w-7 h-0.5 bg-gradient-to-l from-amber-500/80 to-amber-500/30 z-10">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-[#0a0a0f] border-2 border-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </div>

        {/* 影片卡片主體 */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-amber-500/10">
          {/* 拍攝時間與分組 (影片上方) */}
          <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-mono text-amber-300 font-bold">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{displayDate}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans font-normal">
                {isShooting ? "拍攝" : "發布"}
              </span>
            </div>

            {video.groupNames && video.groupNames.length > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-zinc-300 font-medium">
                <Layers className="w-3 h-3 text-amber-400" />
                <span className="truncate max-w-[130px]">
                  {video.groupNames.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* 影片縮圖 (16:9) */}
          <Link
            href={`/video/${video.id}`}
            className="relative aspect-video w-full overflow-hidden bg-zinc-900 block"
          >
            <img
              src={video.thumbnail || "/cover-placeholder.svg"}
              alt={video.title}
              loading="lazy"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-11 h-11 rounded-full bg-amber-500/90 backdrop-blur-md text-black flex items-center justify-center shadow-lg shadow-amber-500/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>

            {video.ytPrivacyStatus && video.ytPrivacyStatus !== "public" && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-amber-300">
                {video.ytPrivacyStatus === "unlisted" ? "不公開" : "私人"}
              </div>
            )}
          </Link>

          {/* 影片標題與標籤 */}
          <div className="p-4 space-y-2.5">
            <Link href={`/video/${video.id}`}>
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                {video.title}
              </h3>
            </Link>

            {video.tags && video.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                {video.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTag(tag);
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
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 頂部搜尋與過濾工具列 */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 space-y-4 border border-white/10 shadow-lg">
        {/* 搜尋列 */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="搜尋影片標題、#標籤關鍵字..."
        />

        {/* 分組過濾 Bar */}
        {groups.length > 0 && (
          <GroupFilterBar
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
          />
        )}

        {/* 年份快捷 Chips */}
        {yearStats.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>年份:</span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear(null)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedYear === null
                  ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                  : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
              }`}
            >
              全部年份
            </button>
            {yearStats.map(({ year, count }) => (
              <button
                key={year}
                type="button"
                onClick={() =>
                  setSelectedYear(selectedYear === year ? null : year)
                }
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedYear === year
                    ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                }`}
              >
                {year} 年 ({count})
              </button>
            ))}
          </div>
        )}

        {/* 標籤過濾 Chips */}
        {allTags.length > 0 && (
          <TagFilterChips
            tags={allTags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
          />
        )}
      </div>

      {/* 控制列：結果統計、排序切換、檢視模式切換 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <span>
            已顯示{" "}
            <strong className="text-amber-400 font-semibold font-mono">
              {displayedVideos.length}
            </strong>{" "}
            / {filteredVideos.length} 部影片
          </span>

          {(selectedGroupId || selectedYear || selectedTag || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSelectedGroupId(null);
                setSelectedYear(null);
                setSelectedTag(null);
                setSearchQuery("");
              }}
              className="text-amber-400 hover:text-amber-300 transition-colors underline cursor-pointer ml-2"
            >
              重設篩選
            </button>
          )}
        </div>

        {/* 右側按鈕：排序切換與檢視模式 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 由新到舊 / 由舊到新 切換 */}
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white border border-white/10 transition-all font-medium cursor-pointer"
            title="點擊切換時間排序方式"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            <span>{sortOrder === "desc" ? "📅 由新到舊" : "📅 由舊到新"}</span>
          </button>

          {/* 模式切換：時間軸 vs 網格 */}
          <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-amber-500 text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="時間軸檢視"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>時間軸</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-amber-500 text-black font-semibold shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="網格圖卡檢視"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>網格</span>
            </button>
          </div>
        </div>
      </div>

      {/* 影片呈現區域 */}
      {filteredVideos.length > 0 ? (
        <div className="space-y-8">
          {viewMode === "timeline" ? (
            /* 🌟 時間軸佈局 (中央時間軸 + 雙欄左右交錯密集排列 + 橫線延伸連接) */
            <div className="relative py-4">
              {/* 中央縱向時間軸線 (桌面版置中，行動版靠左) */}
              <div className="absolute left-3.5 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-500/70 via-amber-500/30 to-amber-500/5 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />

              {/* 雙欄交錯佈局 (桌面版左右錯開，行動版單欄) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-7 md:pl-0">
                {/* 左欄影片 (偶數項) */}
                <div className="space-y-6 md:pr-6 lg:pr-8">
                  {leftColumnVideos.map((video) =>
                    renderTimelineCard(video, true)
                  )}
                </div>

                {/* 右欄影片 (奇數項，適度頂部偏移達成左右交錯) */}
                <div className="space-y-6 md:pl-6 lg:pl-8 md:pt-16 lg:pt-20">
                  {rightColumnVideos.map((video) =>
                    renderTimelineCard(video, false)
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* 網格圖卡佈局 */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {displayedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onTagClick={(tag) => setSelectedTag(tag)}
                />
              ))}
            </div>
          )}

          {/* 載入更多影片分頁按鈕 */}
          {filteredVideos.length > visibleCount && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>
                  載入更多影片 (每次載入 {PAGE_SIZE} 部，剩餘{" "}
                  {filteredVideos.length - visibleCount} 部)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVisibleCount(filteredVideos.length)}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
              >
                顯示全部 ({filteredVideos.length} 部)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 空狀態 */
        <div className="glass-card rounded-2xl p-12 text-center border border-white/10 flex flex-col items-center justify-center space-y-4 my-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-800/60 border border-white/10 flex items-center justify-center text-zinc-500">
            {searchQuery || selectedTag || selectedYear || selectedGroupId ? (
              <SearchX className="w-6 h-6 text-zinc-400" />
            ) : (
              <Film className="w-6 h-6 text-zinc-400" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-zinc-200">
              {searchQuery || selectedTag || selectedYear || selectedGroupId
                ? "沒有符合條件的影片"
                : "目前尚無任何影片"}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-sm">
              {searchQuery || selectedTag || selectedYear || selectedGroupId
                ? "請嘗試更換關鍵字、清除標籤或切換至其他分組或年份查看。"
                : "管理員尚未加入任何影片，請稍後再來查看。"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeedClient;

