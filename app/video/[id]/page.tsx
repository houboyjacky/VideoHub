import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Calendar, Tag, Layers } from "lucide-react";

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
      {/* 返回按鈕 */}
      <div>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl glass-btn text-xs font-medium text-zinc-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>返回影片動態</span>
        </Link>
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
