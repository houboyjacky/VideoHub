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
  CheckSquare,
  Square,
  FolderPlus,
  FolderMinus,
  CheckCheck,
  ArrowUpDown,
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

  // 版面樣式：預設為網格圖卡 (grid)，亦支援切換為橫式清單 (list)
  const [layoutMode, setLayoutMode] = useState<"list" | "grid">("grid");

  // 排序模式：預設為「由新到舊」(desc)，可切換為「由舊到新」(asc)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // 篩選與搜尋狀態
  const [filterPrivacy, setFilterPrivacy] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 分頁載入筆數 (預設 12 筆，以 3 的倍數遞增)
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // 批次打勾選取狀態
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchTargetGroupIds, setBatchTargetGroupIds] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState<"set" | "add">("set");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // 批次彈窗內快速新增分組狀態
  const [showInlineAddGroup, setShowInlineAddGroup] = useState(false);
  const [inlineNewGroupName, setInlineNewGroupName] = useState("");
  const [creatingInlineGroup, setCreatingInlineGroup] = useState(false);

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

  // 3. 尚未分類統計 (未指派任何群組的影片數量)
  const uncategorizedCount = useMemo(() => {
    return videos.filter((v) => !v.groupIds || v.groupIds.length === 0).length;
  }, [videos]);

  // 4. 多重交集篩選後的影片清單
  const filteredVideos = useMemo(() => {
    const list = videos.filter((v) => {
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

      // 分類群組篩選（包含「尚未分類」特別條件）
      if (filterGroup === "uncategorized") {
        if (v.groupIds && v.groupIds.length > 0) return false;
      } else if (filterGroup !== "all") {
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

    // 排序：預設由新到舊 (desc)，亦支援切換為由舊到新 (asc)
    return [...list].sort((a, b) => {
      const timeA = new Date(a.shootingDate || a.publishedAt || 0).getTime();
      const timeB = new Date(b.shootingDate || b.publishedAt || 0).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [videos, filterPrivacy, filterYear, filterGroup, searchQuery, sortOrder]);

  // 5. 目前分頁可視的影片
  const displayedVideos = useMemo(() => {
    return filteredVideos.slice(0, visibleCount);
  }, [filteredVideos, visibleCount]);

  // 批次打勾選取切換函式
  const toggleSelectVideo = (id: string) => {
    setSelectedVideoIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const isAllDisplayedSelected = useMemo(() => {
    if (displayedVideos.length === 0) return false;
    return displayedVideos.every((v) => selectedVideoIds.includes(v.id));
  }, [displayedVideos, selectedVideoIds]);

  const toggleSelectAllDisplayed = () => {
    if (isAllDisplayedSelected) {
      const displayedIds = displayedVideos.map((v) => v.id);
      setSelectedVideoIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      const displayedIds = displayedVideos.map((v) => v.id);
      setSelectedVideoIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
    }
  };

  const selectAllFiltered = () => {
    setSelectedVideoIds(filteredVideos.map((v) => v.id));
  };

  const clearSelection = () => {
    setSelectedVideoIds([]);
  };

  // 執行批次指派群組
  const handleExecuteBatchGroups = async () => {
    if (selectedVideoIds.length === 0) return;

    try {
      setBatchSubmitting(true);
      setError(null);

      const res = await fetch("/api/admin/videos/batch-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIds: selectedVideoIds,
          groupIds: batchTargetGroupIds,
          mode: batchMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "批次更新分組失敗");

      setSuccess(`已成功更新 ${selectedVideoIds.length} 部影片的分組設定！`);
      setShowBatchModal(false);
      setSelectedVideoIds([]);
      setBatchTargetGroupIds([]);
      fetchVideosAndGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setBatchSubmitting(false);
    }
  };

  // 批次清空分組
  const handleBatchClearGroups = async () => {
    if (selectedVideoIds.length === 0) return;
    if (!confirm(`確定要清空所選取 ${selectedVideoIds.length} 部影片的所有分組嗎？（影片將變為「尚未分類」）`)) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/videos/batch-groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIds: selectedVideoIds,
          groupIds: [],
          mode: "set",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "批次清空分組失敗");

      setSuccess(`已將 ${selectedVideoIds.length} 部影片的分組設定清空（設為尚未分類）！`);
      setSelectedVideoIds([]);
      fetchVideosAndGroups();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 批次彈窗內快速建立新分組
  const handleInlineCreateGroup = async () => {
    if (!inlineNewGroupName.trim()) return;
    try {
      setCreatingInlineGroup(true);
      setError(null);

      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inlineNewGroupName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "建立分組失敗");

      // 重新載入分組清單
      const resGroups = await fetch("/api/admin/groups");
      if (resGroups.ok) {
        const dataGroups = await resGroups.json();
        setGroups(dataGroups.groups || []);
      }

      // 自動將新建立的分組勾選進 batchTargetGroupIds
      if (data.group?.id) {
        setBatchTargetGroupIds((prev) => [...prev, data.group.id]);
      }

      setInlineNewGroupName("");
      setShowInlineAddGroup(false);
      setSuccess(`成功建立並選取新分組「${inlineNewGroupName.trim()}」！`);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setCreatingInlineGroup(false);
    }
  };

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
    <div className="space-y-6 pb-20">
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
            {/* 排序切換按鈕 (由新到舊 / 由舊到新) */}
            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-xs font-medium cursor-pointer"
              title={
                sortOrder === "desc"
                  ? "目前為「由新到舊 (最新優先)」，點擊切換為「由舊到新」"
                  : "目前為「由舊到新 (最早優先)」，點擊切換為「由新到舊」"
              }
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{sortOrder === "desc" ? "📅 由新到舊" : "📅 由舊到新"}</span>
            </button>

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
                <span className="hidden sm:inline">橫式清單</span>
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
              顯示 <strong className="text-amber-400 font-mono text-sm">{displayedVideos.length}</strong> / {filteredVideos.length} 部
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

        {/* 3. 分類群組標籤篩選（包含「尚未分類」） */}
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

          {/* 🌟 尚未分類專屬按鈕 */}
          <button
            type="button"
            onClick={() => setFilterGroup("uncategorized")}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              filterGroup === "uncategorized"
                ? "bg-amber-500 text-black font-bold shadow-md shadow-amber-500/30"
                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            <span>⚠️ 尚未分類</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/40">
              {uncategorizedCount}
            </span>
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

        {/* 4. 批次全選工具列 */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAllDisplayed}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-zinc-300 transition-colors cursor-pointer"
            >
              {isAllDisplayedSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-400" />
              ) : (
                <Square className="w-4 h-4 text-zinc-500" />
              )}
              <span>全選本頁 ({displayedVideos.length})</span>
            </button>

            {filteredVideos.length > displayedVideos.length && (
              <button
                type="button"
                onClick={selectAllFiltered}
                className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 text-amber-300 transition-colors cursor-pointer"
              >
                全選所有篩選結果 ({filteredVideos.length})
              </button>
            )}

            {selectedVideoIds.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="text-xs text-zinc-400 hover:text-white underline cursor-pointer ml-2"
              >
                清除選取 ({selectedVideoIds.length})
              </button>
            )}
          </div>

          {selectedVideoIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-semibold">
                已選取 {selectedVideoIds.length} 部影片
              </span>
              <button
                type="button"
                onClick={() => {
                  setBatchTargetGroupIds([]);
                  setBatchMode("set");
                  setShowBatchModal(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>放入指定分類</span>
              </button>
            </div>
          )}
        </div>
      </GlassCard>

      {/* 影片列表主體 */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
          <p className="text-xs">正在載入影片庫與分組資料...</p>
        </div>
      ) : videos.length === 0 ? (
        <GlassCard className="p-12 text-center border border-white/10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Film className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">影片庫尚無任何影片</h3>
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
            請嘗試切換狀態、年份、分組或清除搜尋關鍵字。
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterPrivacy("all");
              setFilterYear("all");
              setFilterGroup("all");
              setSearchQuery("");
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 text-xs font-medium border border-white/10 cursor-pointer"
          >
            清除篩選條件
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {/* 橫向「左圖 右描述」樣式 */}
          {layoutMode === "list" ? (
            <div className="space-y-4">
              {displayedVideos.map((video) => {
                const isSelected = selectedVideoIds.includes(video.id);
                return (
                  <GlassCard
                    key={video.id}
                    onClick={() => {
                      if (selectedVideoIds.length > 0) {
                        toggleSelectVideo(video.id);
                      }
                    }}
                    className={`p-0 border overflow-hidden flex flex-col sm:flex-row group transition-all duration-300 shadow-lg ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/[0.03] ring-1 ring-amber-500/50"
                        : "border-white/10 hover:border-amber-500/40"
                    } ${selectedVideoIds.length > 0 ? "cursor-pointer" : ""}`}
                  >
                    {/* 左側：選取 Checkbox + 縮圖（點擊圖片直接選取） */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectVideo(video.id);
                      }}
                      className="relative w-full sm:w-64 md:w-72 aspect-video shrink-0 bg-zinc-900 overflow-hidden cursor-pointer select-none"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />

                      {/* 獨立打勾選取按鈕 */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectVideo(video.id);
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30 scale-105"
                              : "border-white/40 bg-black/70 text-transparent hover:border-amber-400 hover:bg-black/90"
                          }`}
                          title={isSelected ? "取消勾選" : "勾選此影片"}
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${isSelected ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </div>

                      {/* 狀態標籤 */}
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono border border-white/10">
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

                          {video.groupNames && video.groupNames.length > 0 ? (
                            <div className="flex items-center gap-1 text-amber-400 font-medium flex-wrap">
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span>{video.groupNames.join(", ")}</span>
                            </div>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold">
                              ⚠️ 尚未分類
                            </span>
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
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                          <span>在 YouTube 開啟</span>
                        </a>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(video.id, video.title);
                            }}
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
                );
              })}
            </div>
          ) : (
            /* 網格圖卡樣式 (每列 3 張圖卡) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedVideos.map((video) => {
                const isSelected = selectedVideoIds.includes(video.id);
                return (
                  <GlassCard
                    key={video.id}
                    onClick={() => {
                      if (selectedVideoIds.length > 0) {
                        toggleSelectVideo(video.id);
                      }
                    }}
                    className={`p-0 border overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
                      isSelected
                        ? "border-amber-500/80 bg-amber-500/[0.03] ring-1 ring-amber-500/50"
                        : "border-white/10 hover:border-amber-500/40"
                    } ${selectedVideoIds.length > 0 ? "cursor-pointer" : ""}`}
                  >
                    {/* 縮圖與 Checkbox（點擊縮圖直接選取） */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectVideo(video.id);
                      }}
                      className="relative aspect-video w-full bg-zinc-900 overflow-hidden cursor-pointer select-none"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />

                      {/* 獨立打勾選取按鈕 */}
                      <div className="absolute top-2.5 left-2.5 z-20">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectVideo(video.id);
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/30 scale-105"
                              : "border-white/40 bg-black/70 text-transparent hover:border-amber-400 hover:bg-black/90"
                          }`}
                          title={isSelected ? "取消勾選" : "勾選此影片"}
                        >
                          <Check className={`w-4 h-4 stroke-[3] ${isSelected ? "opacity-100" : "opacity-0"}`} />
                        </button>
                      </div>

                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono border border-white/10">
                        {video.ytPrivacyStatus === "public" ? (
                          <span className="text-emerald-400 font-medium">🌐 公開</span>
                        ) : video.ytPrivacyStatus === "private" ? (
                          <span className="text-rose-400 font-medium">🔒 私人</span>
                        ) : (
                          <span className="text-sky-400 font-medium">🔗 不公開</span>
                        )}
                      </div>
                    </div>

                    {/* 內文描述 */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1 text-[11px] text-zinc-400">
                          <span className="font-mono">
                            {video.shootingDate
                              ? `拍攝: ${new Date(video.shootingDate).toLocaleDateString("zh-TW")}`
                              : `上傳: ${new Date(video.publishedAt).toLocaleDateString("zh-TW")}`}
                          </span>

                          {video.groupNames && video.groupNames.length > 0 ? (
                            <span className="text-amber-400 font-medium truncate max-w-[120px]">
                              {video.groupNames.join(", ")}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-semibold">
                              尚未分類
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                          {video.title}
                        </h3>

                        {video.tags && video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {video.tags.slice(0, 3).map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-zinc-300 border border-white/10"
                              >
                                #{t}
                              </span>
                            ))}
                            {video.tags.length > 3 && (
                              <span className="text-[10px] text-zinc-500">
                                +{video.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 底部按鈕 */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.ytId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-zinc-400 hover:text-white transition-colors"
                        >
                          YouTube
                        </a>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
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
                            title="編輯"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(video.id, video.title);
                            }}
                            disabled={deletingId === video.id}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                            title="刪除"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}

          {/* 載入更多影片按鈕 */}
          {visibleCount < filteredVideos.length && (
            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="px-6 py-3 rounded-2xl glass-btn text-xs sm:text-sm font-semibold text-zinc-200 hover:text-white hover:border-amber-500/50 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <span>載入更多影片 (剩餘 {filteredVideos.length - visibleCount} 部)</span>
                <ChevronDown className="w-4 h-4 text-amber-400 animate-bounce" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 🌟 底部批次操作浮動列 (Sticky Floating Batch Bar) */}
      {selectedVideoIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-slide-up">
          <div className="p-4 rounded-2xl bg-[#121218]/90 backdrop-blur-2xl border border-amber-500/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold text-xs">
                {selectedVideoIds.length}
              </div>
              <div>
                <div className="font-semibold text-white">
                  已選取 {selectedVideoIds.length} 部影片
                </div>
                <div className="text-[11px] text-zinc-400">
                  可快速批次設定分組或清空分類
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleBatchClearGroups}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-300 hover:text-red-300 border border-white/10 transition-colors cursor-pointer"
              >
                清空分類
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-2 rounded-xl glass-btn text-zinc-400 hover:text-white cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchTargetGroupIds([]);
                  setBatchMode("set");
                  setShowBatchModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/30 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>放入指定分類</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 批次指派分組 Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-lg p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">
                  批次設定分組 ({selectedVideoIds.length} 部影片)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* 模式選擇 */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300">
                指派方式
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setBatchMode("set")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    batchMode === "set"
                      ? "bg-amber-500/15 border-amber-500 text-amber-300 font-semibold"
                      : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="font-bold">覆蓋設定</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    將所選影片的分組重設為勾選的群組
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchMode("add")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    batchMode === "add"
                      ? "bg-amber-500/15 border-amber-500 text-amber-300 font-semibold"
                      : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="font-bold">增量加入</div>
                  <div className="text-[10px] text-zinc-400 mt-0.5">
                    保留原有分組，額外加入勾選的群組
                  </div>
                </button>
              </div>
            </div>

            {/* 群組勾選清單 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-300">
                  請選擇目標分組（多選）
                </label>
                <button
                  type="button"
                  onClick={() => setShowInlineAddGroup(!showInlineAddGroup)}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showInlineAddGroup ? "收起" : "＋ 新增分類"}</span>
                </button>
              </div>

              {/* 快速新增分類輸入框 */}
              {showInlineAddGroup && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/30 space-y-2 animate-fade-in">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="輸入新分組名稱 (例如: 高中同學)"
                      value={inlineNewGroupName}
                      onChange={(e) => setInlineNewGroupName(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleInlineCreateGroup();
                        }
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleInlineCreateGroup}
                      disabled={creatingInlineGroup || !inlineNewGroupName.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {creatingInlineGroup ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      <span>建立</span>
                    </button>
                  </div>
                </div>
              )}

              {groups.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                  目前尚未建立任何自訂群組。可點擊上方「＋ 新增分類」立即新增！
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {groups.map((g) => {
                    const isChecked = batchTargetGroupIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? "bg-amber-500/10 border-amber-500/40 text-white"
                            : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBatchTargetGroupIds([...batchTargetGroupIds, g.id]);
                            } else {
                              setBatchTargetGroupIds(batchTargetGroupIds.filter((id) => id !== g.id));
                            }
                          }}
                        />
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? "bg-amber-500 border-amber-500 text-black"
                              : "border-white/20 bg-black/40"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium truncate">{g.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal 操作按鈕 */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white"
              >
                取消
              </button>

              <button
                type="button"
                onClick={handleExecuteBatchGroups}
                disabled={batchSubmitting || (batchMode === "set" && batchTargetGroupIds.length === 0)}
                className="px-5 py-2 rounded-xl text-xs font-bold glass-btn-primary flex items-center gap-1.5 disabled:opacity-50"
              >
                {batchSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                <span>確認指派至 {selectedVideoIds.length} 部影片</span>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* 新增影片 Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-lg p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">新增單部 YouTube 影片</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  YouTube 影片網址或 ID <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... 或 dQw4w9WgXcQ"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">自訂標題 (選填)</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="留空則自動自 YouTube 獲取"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">拍攝日期 (選填)</label>
                  <input
                    type="date"
                    value={shootingDate}
                    onChange={(e) => setShootingDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">自訂標籤 (以逗號分隔)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="登山, 4K, 旅遊日記"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* 授權群組勾選 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">
                  可觀看此影片之授權分組（留空則只有管理員可看）
                </label>
                {groups.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">尚無自訂分組，可直接新增。</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {groups.map((g) => {
                      const isChecked = selectedGroupIds.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-amber-500/10 border-amber-500/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroupIds([...selectedGroupIds, g.id]);
                              } else {
                                setSelectedGroupIds(selectedGroupIds.filter((id) => id !== g.id));
                              }
                            }}
                          />
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked
                                ? "bg-amber-500 border-amber-500 text-black"
                                : "border-white/20 bg-black/40"
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="truncate">{g.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold glass-btn-primary flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>確認收錄</span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* 編輯影片 Modal */}
      {editingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <GlassCard className="w-full max-w-lg p-6 border border-white/10 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-white">編輯影片設定</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingVideo(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateVideo} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">影片標題</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">拍攝日期 (用於時間排序)</label>
                <input
                  type="date"
                  value={editShootingDate}
                  onChange={(e) => setEditShootingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">標籤 (以逗號分隔)</label>
                <input
                  type="text"
                  value={editTagsInput}
                  onChange={(e) => setEditTagsInput(e.target.value)}
                  placeholder="標籤1, 標籤2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* 授權群組勾選 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">授權分組（多選）</label>
                {groups.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">尚無自訂分組。</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {groups.map((g) => {
                      const isChecked = editGroupIds.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? "bg-amber-500/10 border-amber-500/40 text-white"
                              : "bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05]"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditGroupIds([...editGroupIds, g.id]);
                              } else {
                                setEditGroupIds(editGroupIds.filter((id) => id !== g.id));
                              }
                            }}
                          />
                          <div
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                              isChecked
                                ? "bg-amber-500 border-amber-500 text-black"
                                : "border-white/20 bg-black/40"
                            }`}
                          >
                            {isChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                          <span className="truncate">{g.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingVideo(null)}
                  className="px-4 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold glass-btn-primary flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>儲存變更</span>
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
