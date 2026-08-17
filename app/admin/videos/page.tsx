"use client";

/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect, useMemo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { SyncChannelCard } from "@/components/admin/SyncChannelCard";
import {
  Film,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Tag,
  Loader2,
  Check,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Search,
  Globe,
  X,
  Sparkles,
  LayoutList,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";

interface VideoItem {
  id: string;
  ytId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  shootingDate: string | null;
  groupIds: string[];
  groupNames: string[];
  tags: string[];
  ytPrivacyStatus: string;
}

interface GroupItem {
  id: string;
  name: string;
}

const PAGE_SIZE = 12; // 以 3 的倍數分頁載入

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 版面樣式：預設為「左圖 右描述」橫式清單 (list)，亦支援切換為網格 (grid)
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("list");

  // 篩選與搜尋狀態
  const [filterPrivacy, setFilterPrivacy] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 分頁載入筆數 (預設 12 筆，以 3 的倍數遞增)
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // 新增影片狀態
  const [showAddModal, setShowAddModal] = useState(false);
  const [url, setUrl] = useState("");
  const [shootingDate, setShootingDate] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 編輯影片狀態
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editShootingDate, setEditShootingDate] = useState("");
  const [editGroupIds, setEditGroupIds] = useState<string[]>([]);
  const [editTagsInput, setEditTagsInput] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchVideosAndGroups = async () => {
    try {
      setLoading(true);
      const [resVideos, resGroups] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/admin/groups"),
      ]);

      const dataVideos = await resVideos.json();
      const dataGroups = await resGroups.json();

      if (!resVideos.ok) throw new Error(dataVideos.error || "無法載入影片清單");

      setVideos(dataVideos.videos || []);
      setGroups(dataGroups.groups || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideosAndGroups();
  }, []);

  // 當條件變更時，自動重置分頁筆數至 PAGE_SIZE
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterPrivacy, filterYear, filterGroup, searchQuery]);

  // 1. 隱私狀態統計 (公開 / 不公開 / 私人)
  const privacyStats = useMemo(() => {
    const publicCount = videos.filter((v) => v.ytPrivacyStatus === "public").length;
    const unlistedCount = videos.filter((v) => v.ytPrivacyStatus === "unlisted" || !v.ytPrivacyStatus).length;
    const privateCount = videos.filter((v) => v.ytPrivacyStatus === "private").length;
    return {
      all: videos.length,
      public: publicCount,
      unlisted: unlistedCount,
      private: privateCount,
    };
  }, [videos]);

  // 2. 年份統計 (動態統計拍攝年份或發布年份)
  const yearStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of videos) {
      const date = v.shootingDate ? new Date(v.shootingDate) : v.publishedAt ? new Date(v.publishedAt) : null;
      if (date && !isNaN(date.getTime())) {
        const y = date.getFullYear().toString();
        map.set(y, (map.get(y) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([year, count]) => ({ year, count }));
  }, [videos]);

  // 3. 多重交集篩選後的影片清單
  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      // 隱私狀態篩選
      if (filterPrivacy !== "all") {
        const p = v.ytPrivacyStatus || "unlisted";
        if (p !== filterPrivacy) return false;
      }

      // 年份篩選
      if (filterYear !== "all") {
        const date = v.shootingDate ? new Date(v.shootingDate) : v.publishedAt ? new Date(v.publishedAt) : null;
        if (!date || isNaN(date.getTime()) || date.getFullYear().toString() !== filterYear) {
          return false;
        }
      }

      // 分類群組篩選
      if (filterGroup !== "all") {
        if (!v.groupIds || !v.groupIds.includes(filterGroup)) {
          return false;
        }
      }

      // 關鍵字搜尋 (標題與標籤)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = v.title?.toLowerCase().includes(q);
        const inTags = v.tags?.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inTags) return false;
      }

      return true;
    });
  }, [videos, filterPrivacy, filterYear, filterGroup, searchQuery]);

  // 4. 目前分頁可視的影片
  const displayedVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          shootingDate: shootingDate || null,
          groupIds: selectedGroupIds,
          tags: tagsInput,
          customTitle: customTitle || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "新增影片失敗");

      setSuccess(`已成功收錄影片「${data.video.title}」！`);
      setShowAddModal(false);
      setUrl("");
      setShootingDate("");
      setSelectedGroupIds([]);
      setTagsInput("");
      setCustomTitle("");
      fetchVideosAndGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVideo) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`/api/admin/videos/${editingVideo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          shootingDate: editShootingDate || null,
          groupIds: editGroupIds,
          tags: editTagsInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "更新影片失敗");

      setSuccess(`已成功更新影片！`);
      setEditingVideo(null);
      fetchVideosAndGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`確定要從系統中移除影片「${title}」嗎？\n（YouTube 上的原始影片不會受到任何影響）`)) {
      return;
    }

    try {
      setDeletingId(id);
      setError(null);

      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "刪除失敗");

      setSuccess(`已成功移除該影片記錄`);
      fetchVideosAndGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 訊息提示 */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-300 text-xs sm:text-sm">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs sm:text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 頂部操作按鈕與全頻道同步 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white">影片庫清單</h2>
          <p className="text-xs text-zinc-400">目前共收錄 {videos.length} 部影片</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <SyncChannelCard compact={true} onSyncComplete={() => fetchVideosAndGroups()} />

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl glass-btn-primary flex items-center gap-2 text-xs sm:text-sm font-semibold cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>新增單部影片</span>
          </button>
        </div>
      </div>

      {/* 快捷統計與標籤篩選列 */}
      <GlassCard className="p-5 border border-white/10 space-y-4 shadow-xl">
        {/* 搜尋與版面切換列 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="快速搜尋影片標題、標籤..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end text-xs text-zinc-400">
            {/* 版面切換按鈕 */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setLayoutMode("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  layoutMode === "list"
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="左圖右描述 (橫式列表)"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">左圖右描述</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  layoutMode === "grid"
                    ? "bg-amber-500 text-black font-semibold shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="網格圖卡"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">網格圖卡</span>
              </button>
            </div>

            <span>
              已顯示 <strong className="text-amber-400 font-mono text-sm">{displayedVideos.length}</strong> / {filteredVideos.length} 部
            </span>

            {(filterPrivacy !== "all" || filterYear !== "all" || filterGroup !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setFilterPrivacy("all");
                  setFilterYear("all");
                  setFilterGroup("all");
                  setSearchQuery("");
                }}
                className="text-xs text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
              >
                重設條件
              </button>
            )}
          </div>
        </div>

        {/* 1. 隱私狀態標籤篩選 (公開 / 不公開 / 私人) */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
          <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mr-1">
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span>狀態:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterPrivacy("all")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterPrivacy === "all"
                ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
            }`}
          >
            全部 ({privacyStats.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterPrivacy("public")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterPrivacy === "public"
                ? "bg-emerald-500 text-black font-semibold shadow-md shadow-emerald-500/20"
                : "bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/20"
            }`}
          >
            🌐 公開 ({privacyStats.public})
          </button>
          <button
            type="button"
            onClick={() => setFilterPrivacy("unlisted")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterPrivacy === "unlisted"
                ? "bg-sky-500 text-black font-semibold shadow-md shadow-sky-500/20"
                : "bg-white/5 hover:bg-white/10 text-sky-400 border border-sky-500/20"
            }`}
          >
            🔗 不公開 ({privacyStats.unlisted})
          </button>
          <button
            type="button"
            onClick={() => setFilterPrivacy("private")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterPrivacy === "private"
                ? "bg-rose-500 text-black font-semibold shadow-md shadow-rose-500/20"
                : "bg-white/5 hover:bg-white/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            🔒 私人 ({privacyStats.private})
          </button>
        </div>

        {/* 2. 年份標籤篩選 (自動統計並降冪排列) */}
        {yearStats.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>年份:</span>
            </span>
            <button
              type="button"
              onClick={() => setFilterYear("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterYear === "all"
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
                onClick={() => setFilterYear(year)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterYear === year
                    ? "bg-amber-500 text-black font-semibold shadow-md shadow-amber-500/20"
                    : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                }`}
              >
                {year} 年 ({count})
              </button>
            ))}
          </div>
        )}

        {/* 3. 分類群組標籤篩選 */}
        {groups.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>分組:</span>
            </span>
            <button
              type="button"
              onClick={() => setFilterGroup("all")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                filterGroup === "all"
                  ? "bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20"
                  : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
              }`}
            >
              全部分組
            </button>
            {groups.map((g) => {
              const count = videos.filter((v) => v.groupIds?.includes(g.id)).length;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setFilterGroup(g.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    filterGroup === g.id
                      ? "bg-purple-500 text-white font-semibold shadow-md shadow-purple-500/20"
                      : "bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5"
                  }`}
                >
                  {g.name} ({count})
                </button>
              );
            })}
          </div>
        )}
      </GlassCard>

      {/* 影片清單區域 */}
      {loading ? (
        <div className="py-20 flex justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      ) : videos.length === 0 ? (
        <GlassCard className="p-12 text-center border border-white/10 space-y-4">
          <Film className="w-10 h-10 text-zinc-500 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">影片庫目前為空</h3>
            <p className="text-xs text-zinc-400">
              點擊上方「立即同步全頻道影片」或「新增單部影片」開始收錄！
            </p>
          </div>
        </GlassCard>
      ) : filteredVideos.length === 0 ? (
        <GlassCard className="p-12 text-center border border-white/10 space-y-3">
          <Search className="w-8 h-8 text-zinc-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">無符合篩選條件的影片</h3>
          <p className="text-xs text-zinc-400">
            請嘗試切換狀態、年份或清除搜尋關鍵字。
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterPrivacy("all");
              setFilterYear("all");
              setFilterGroup("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-medium border border-white/10"
          >
            清除篩選
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* 橫向「左圖 右描述」樣式 */}
          {layoutMode === "list" ? (
            <div className="space-y-4">
              {displayedVideos.map((video) => (
                <GlassCard
                  key={video.id}
                  className="p-0 border border-white/10 overflow-hidden flex flex-col sm:flex-row group hover:border-amber-500/40 transition-all duration-300 shadow-lg"
                >
                  {/* 左側：縮圖 */}
                  <div className="relative w-full sm:w-64 md:w-72 aspect-video shrink-0 bg-zinc-900 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono border border-white/10">
                      {video.ytPrivacyStatus === "public" ? (
                        <span className="text-emerald-400 font-medium">🌐 公開</span>
                      ) : video.ytPrivacyStatus === "private" ? (
                        <span className="text-rose-400 font-medium">🔒 私人</span>
                      ) : (
                        <span className="text-sky-400 font-medium">🔗 不公開</span>
                      )}
                    </div>
                  </div>

                  {/* 右側：詳細資訊與描述 */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>
                            {video.shootingDate
                              ? `拍攝: ${new Date(video.shootingDate).toLocaleDateString("zh-TW")}`
                              : `上傳: ${new Date(video.publishedAt).toLocaleDateString("zh-TW")}`}
                          </span>
                        </span>

                        {video.groupNames && video.groupNames.length > 0 && (
                          <div className="flex items-center gap-1 text-amber-400/90 font-medium">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{video.groupNames.join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-white group-hover:text-amber-300 transition-colors leading-snug line-clamp-2">
                        {video.title}
                      </h3>

                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {video.tags.map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[11px] bg-white/[0.04] text-zinc-300 border border-white/10"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底部操作與 YouTube 連結 */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.ytId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                        <span>在 YouTube 開啟</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVideo(video);
                            setEditTitle(video.title);
                            setEditShootingDate(
                              video.shootingDate
                                ? new Date(video.shootingDate).toISOString().split("T")[0]
                                : ""
                            );
                            setEditGroupIds(video.groupIds || []);
                            setEditTagsInput((video.tags || []).join(", "));
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-200 hover:text-white text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>編輯設定</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(video.id, video.title)}
                          disabled={deletingId === video.id}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                          title="移除影片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            /* 網格圖卡樣式 (每列 3 張圖卡) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedVideos.map((video) => (
                <GlassCard
                  key={video.id}
                  className="p-0 border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-amber-500/40 transition-all"
                >
                  {/* 縮圖 */}
                  <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono border border-white/10">
                      {video.ytPrivacyStatus === "public" ? (
                        <span className="text-emerald-400 font-medium">🌐 公開</span>
                      ) : video.ytPrivacyStatus === "private" ? (
                        <span className="text-rose-400 font-medium">🔒 私人</span>
                      ) : (
                        <span className="text-sky-400 font-medium">🔗 不公開</span>
                      )}
                    </div>
                  </div>

                  {/* 資訊 */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>
                            {video.shootingDate
                              ? `拍攝: ${new Date(video.shootingDate).toLocaleDateString("zh-TW")}`
                              : `上傳: ${new Date(video.publishedAt).toLocaleDateString("zh-TW")}`}
                          </span>
                        </span>

                        {video.groupNames && video.groupNames.length > 0 && (
                          <span className="flex items-center gap-1 text-amber-400/90 truncate max-w-[120px]">
                            <Layers className="w-3 h-3" />
                            <span>{video.groupNames.join(", ")}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                        {video.title}
                      </h3>

                      {video.tags && video.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {video.tags.map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-zinc-400 border border-white/5"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 底部操作 */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <a
                        href={`https://www.youtube.com/watch?v=${video.ytId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>YouTube</span>
                      </a>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingVideo(video);
                            setEditTitle(video.title);
                            setEditShootingDate(
                              video.shootingDate
                                ? new Date(video.shootingDate).toISOString().split("T")[0]
                                : ""
                            );
                            setEditGroupIds(video.groupIds || []);
                            setEditTagsInput((video.tags || []).join(", "));
                          }}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          title="編輯影片設定"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(video.id, video.title)}
                          disabled={deletingId === video.id}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                          title="移除影片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}

          {/* 載入更多影片分頁按鈕 (以 3 的倍數遞增載入) */}
          {filteredVideos.length > visibleCount && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
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
      )}

      {/* 新增影片 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Film className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">收錄新 YouTube 影片</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  YouTube 影片網址或 ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtu.be/... 或 影片 ID"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  支援 YouTube 一般影片、Shorts、youtu.be 短網址與不公開影片
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  自訂影片標題 (選填，若留空將自動由 YouTube 讀取)
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="輸入自訂標題..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  拍攝日期 (選填)
                </label>
                <input
                  type="date"
                  value={shootingDate}
                  onChange={(e) => setShootingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  指定可見之好友分組 (若都不勾選則全體審核通過之好友皆可見)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/20 border border-white/5">
                  {groups.map((group) => {
                    const isSelected = selectedGroupIds.includes(group.id);
                    return (
                      <button
                        type="button"
                        key={group.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedGroupIds(selectedGroupIds.filter((id) => id !== group.id));
                          } else {
                            setSelectedGroupIds([...selectedGroupIds, group.id]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all text-left ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-white/[0.02] text-zinc-400 hover:text-white border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-black"
                              : "border-zinc-600"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{group.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  影片標籤 (請用半形逗號分隔)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="例如: 日本旅遊, 滑雪, 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{submitting ? "正在解析並新增..." : "確認收錄"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 編輯影片 Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-semibold text-white">編輯影片資訊與分組</h3>
              </div>
              <button
                onClick={() => setEditingVideo(null)}
                className="text-zinc-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  影片標題
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  拍攝日期
                </label>
                <input
                  type="date"
                  value={editShootingDate}
                  onChange={(e) => setEditShootingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  可觀看此影片之好友分組
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-black/20 border border-white/5">
                  {groups.map((group) => {
                    const isSelected = editGroupIds.includes(group.id);
                    return (
                      <button
                        type="button"
                        key={group.id}
                        onClick={() => {
                          if (isSelected) {
                            setEditGroupIds(editGroupIds.filter((id) => id !== group.id));
                          } else {
                            setEditGroupIds([...editGroupIds, group.id]);
                          }
                        }}
                        className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all text-left ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : "bg-white/[0.02] text-zinc-400 hover:text-white border border-transparent"
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isSelected
                              ? "bg-amber-500 border-amber-500 text-black"
                              : "border-zinc-600"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5" />}
                        </div>
                        <span className="truncate">{group.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  影片標籤 (逗號分隔)
                </label>
                <input
                  type="text"
                  value={editTagsInput}
                  onChange={(e) => setEditTagsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{submitting ? "正在儲存..." : "儲存變更"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
