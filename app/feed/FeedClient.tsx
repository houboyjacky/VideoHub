"use client";

import React, { useState, useMemo, useEffect } from "react";
import { VideoCard, VideoCardData } from "@/components/VideoCard";
import { GroupFilterBar, GroupItem } from "@/components/GroupFilterBar";
import { SearchBar } from "@/components/SearchBar";
import { TagFilterChips } from "@/components/TagFilterChips";
import { Film, SearchX, Calendar, ChevronDown } from "lucide-react";

interface FeedClientProps {
  initialVideos: VideoCardData[];
  groups: GroupItem[];
  allTags: string[];
}

const PAGE_SIZE = 12; // 預設單頁載入筆數（以 3 的倍數顯示）

export function FeedClient({
  initialVideos,
  groups,
  allTags,
}: FeedClientProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 分頁可視數量 (預設 12 筆，以 3 的倍數增加)
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // 條件變更時自動重設分頁筆數
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedGroupId, selectedYear, selectedTag, searchQuery]);

  // 年份動態統計
  const yearStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of initialVideos) {
      const date = v.shootingDate ? new Date(v.shootingDate) : v.publishedAt ? new Date(v.publishedAt) : null;
      if (date && !isNaN(date.getTime())) {
        const y = date.getFullYear().toString();
        map.set(y, (map.get(y) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, count]) => ({ year, count }));
  }, [initialVideos]);

  // 前端即時多重交集過濾
  const filteredVideos = useMemo(() => {
    return initialVideos.filter((video) => {
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
        const date = video.shootingDate ? new Date(video.shootingDate) : video.publishedAt ? new Date(video.publishedAt) : null;
        if (!date || isNaN(date.getTime()) || date.getFullYear().toString() !== selectedYear) {
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
        const inTags = video.tags?.some((t) => t.toLowerCase().includes(q)) ?? false;
        if (!inTitle && !inTags) {
          return false;
        }
      }

      return true;
    });
  }, [initialVideos, selectedGroupId, selectedYear, selectedTag, searchQuery]);

  // 當前分頁顯示之影片
  const displayedVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

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
                onClick={() => setSelectedYear(selectedYear === year ? null : year)}
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

      {/* 影片結果統計 */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <span>
          已顯示 <strong className="text-amber-400 font-semibold font-mono">{displayedVideos.length}</strong> / {filteredVideos.length} 部影片
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
            className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            重設所有篩選
          </button>
        )}
      </div>

      {/* 影片網格動態牆 (最新在最上方) */}
      {filteredVideos.length > 0 ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onTagClick={(tag) => setSelectedTag(tag)}
              />
            ))}
          </div>

          {/* 載入更多影片分頁按鈕 (以 3 的倍數遞增載入) */}
          {filteredVideos.length > visibleCount && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
                <span>
                  載入更多影片 (每次載入 {PAGE_SIZE} 部，剩餘 {filteredVideos.length - visibleCount} 部)
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
