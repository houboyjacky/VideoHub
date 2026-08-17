import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Layers, ExternalLink, AlertCircle } from "lucide-react";

export default async function VideoPlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user;

  if (!user || user.status !== "approved") {
    return notFound();
  }

  const video = await prisma.video.findUnique({
    where: { id, deleted: false },
  });

  if (!video) {
    return notFound();
  }

  const isAdmin = !!user.isAdmin;
  const userGroupIds = user.groupIds || [];

  // 權限檢查：非管理員必須與該影片的分組有交集
  if (!isAdmin) {
    const hasAccess = video.groupIds.some((gid) => userGroupIds.includes(gid));
    if (!hasAccess) {
      return notFound();
    }
  }

  // 取得分組名稱
  const groups = await prisma.group.findMany({
    where: { id: { in: video.groupIds } },
  });

  const displayDate = video.shootingDate
    ? new Date(video.shootingDate).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date(video.publishedAt).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 relative z-10 space-y-6">
      {/* 頂部操作列：返回動態 & 在 YouTube 開啟按鈕 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回影片動態</span>
        </Link>

        <a
          href={`https://www.youtube.com/watch?v=${video.ytId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-200 hover:text-white text-xs font-semibold border border-red-500/30 hover:border-red-500/50 shadow-lg shadow-red-950/30 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current text-red-500 shrink-0" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          <span>在 YouTube 開啟觀看</span>
          <ExternalLink className="w-3.5 h-3.5 text-red-400" />
        </a>
      </div>

      {/* 影片播放器 (16:9 比例，無任何暗角或內陰影) */}
      <div className="relative aspect-video w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.ytId}?rel=0&modestbranding=1&autoplay=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0 block"
        />
      </div>

      {/* 提示訊息：私人影片安全說明與引導 */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-amber-300">
            💡 遇到「這是私人影片請先登入」或黑畫面無法播放？
          </p>
          <p className="text-zinc-300 text-[11px] leading-normal">
            依據 YouTube 安全政策與現代瀏覽器第三方 Cookie 隔離機制，設為「<strong className="text-amber-300">私人 (Private)</strong>」的影片無法在任何外部網站的內嵌播放器中直接播放。
            若您已被授權，可點擊上方「<strong className="text-red-400">在 YouTube 開啟觀看</strong>」按鈕前往原站收看；
            若您是創作者，建議在 YouTube 影片設定中將隱私狀態改為「<strong className="text-emerald-400 font-bold">不公開 (Unlisted)</strong>」，即可在 VideoHub 網站內直接流暢播放！
          </p>
        </div>
      </div>

      {/* 影片詳細資訊 */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10">
        <div className="space-y-3">
          {/* 分組與日期標籤 */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 font-mono text-zinc-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{displayDate}</span>
                {video.shootingDate && (
                  <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    拍攝日期
                  </span>
                )}
              </span>
            </div>

            {groups.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300/90 font-medium">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>分組：{groups.map((g) => g.name).join(", ")}</span>
              </div>
            )}
          </div>

          {/* 標題 */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight">
            {video.title}
          </h1>
        </div>

        {/* 標籤 Chips */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {video.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs text-zinc-300"
              >
                <Tag className="w-3 h-3 text-amber-400" />
                <span>#{tag}</span>
              </span>
            ))}
          </div>
        )}

        {/* 影片描述 (若有) */}
        {video.description && (
          <div className="pt-4 border-t border-white/5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              影片說明
            </h3>
            <p className="text-sm text-zinc-300 whitespace-pre-line leading-relaxed">
              {video.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
