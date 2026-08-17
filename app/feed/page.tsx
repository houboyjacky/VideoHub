import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FeedClient } from "./FeedClient";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function FeedPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || user.status !== "approved") {
    return null;
  }

  const isAdmin = !!user.isAdmin;
  const userGroupIds = user.groupIds || [];

  // 若非管理員且完全未被分配任何分組
  if (!isAdmin && userGroupIds.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center relative z-10">
        <div className="glass-card rounded-2xl p-8 border border-white/10 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">尚未分配分組</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            您的帳號已審核通過，但管理員尚未為您分配影片分組權限。請稍後重試或直接與 Jacky 聯繫。
          </p>
          <Link
            href="/"
            className="inline-block py-2.5 px-6 rounded-xl glass-btn text-xs font-semibold text-zinc-300 hover:text-white"
          >
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  // 1. 取得用戶有權限的分組清單
  const visibleGroups = await prisma.group.findMany({
    where: isAdmin ? {} : { id: { in: userGroupIds } },
    orderBy: { name: "asc" },
  });
  const groupMap = new Map(visibleGroups.map((g) => [g.id, g.name]));

  // 2. 取得用戶有權限的影片清單 (最新在最上面)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    deleted: false,
  };

  if (!isAdmin) {
    where.groupIds = { hasSome: userGroupIds };
  }

  const rawVideos = await prisma.video.findMany({
    where,
    orderBy: [
      { shootingDate: "desc" },
      { publishedAt: "desc" },
    ],
  });

  // 3. 彙整標籤與關聯分組名稱
  const allTagsSet = new Set<string>();
  const initialVideos = rawVideos.map((v) => {
    v.tags.forEach((t) => allTagsSet.add(t));
    return {
      id: v.id,
      ytId: v.ytId,
      title: v.title,
      thumbnail: v.thumbnail,
      publishedAt: v.publishedAt.toISOString(),
      shootingDate: v.shootingDate ? v.shootingDate.toISOString() : null,
      groupIds: v.groupIds,
      groupNames: v.groupIds
        .map((gid) => groupMap.get(gid))
        .filter(Boolean) as string[],
      tags: v.tags,
      ytPrivacyStatus: v.ytPrivacyStatus || undefined,
    };
  });

  const allTags = Array.from(allTagsSet).sort();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
      <FeedClient
        initialVideos={initialVideos}
        groups={visibleGroups.map((g) => ({ id: g.id, name: g.name }))}
        allTags={allTags}
      />
    </div>
  );
}
