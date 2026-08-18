import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Metadata } from "next";
import { ShareGroupClient } from "@/components/share/ShareGroupClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ shareId: string }>;
  searchParams: Promise<{ code?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareId } = await params;
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "VideoHub";
  const siteUrl = process.env.NEXTAUTH_URL || "https://your-domain.com";

  const group = await prisma.group.findFirst({
    where: {
      OR: [{ shareId }, { id: shareId }],
    },
  });

  if (!group) {
    return {
      title: `找不到分組 - ${appName}`,
    };
  }

  const videoCount = await prisma.video.count({
    where: { groupIds: { has: group.id }, deleted: false },
  });

  const title = `🎬 【${group.name}】精選影音專區 - ${appName}`;
  const description = group.description
    ? `${group.description}（共收錄 ${videoCount} 部專屬影音，邀請制限定開放）`
    : `共收錄 ${videoCount} 部專屬影音，持邀請碼即可立即解鎖完整影片串流。`;

  const ogImageUrl = `${siteUrl}/api/og/group/${group.shareId || group.id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteUrl}/share/group/${group.shareId || group.id}`,
      siteName: appName,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: group.name,
        },
      ],
      type: "video.other",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ShareGroupPage({ params, searchParams }: Props) {
  const { shareId } = await params;
  const { code } = await searchParams;

  const group = await prisma.group.findFirst({
    where: {
      OR: [{ shareId }, { id: shareId }],
    },
  });

  if (!group) {
    notFound();
  }

  const [totalCount, rawVideos] = await Promise.all([
    prisma.video.count({
      where: {
        groupIds: { has: group.id },
        deleted: false,
      },
    }),
    prisma.video.findMany({
      where: {
        groupIds: { has: group.id },
        deleted: false,
      },
      orderBy: [{ shootingDate: "desc" }, { publishedAt: "desc" }],
      take: 12,
    }),
  ]);

  const session = await auth();
  const user = session?.user;
  const isLoggedIn = !!user;
  const isUnlocked = !!(user && (user.isAdmin || user.groupIds?.includes(group.id)));

  const videos = rawVideos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnail: v.thumbnail,
    publishedAt: v.publishedAt,
    shootingDate: v.shootingDate,
    tags: v.tags || [],
  }));

  return (
    <ShareGroupClient
      group={{
        id: group.id,
        name: group.name,
        description: group.description,
        shareId: group.shareId || group.id,
      }}
      totalCount={totalCount}
      videos={videos}
      isLoggedIn={isLoggedIn}
      isUnlocked={isUnlocked}
      initialCode={code || ""}
    />
  );
}
