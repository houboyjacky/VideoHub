import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await context.params;

  try {
    const group = await prisma.group.findFirst({
      where: {
        OR: [{ shareId }, { id: shareId }],
      },
    });

    if (group) {
      // 尋找此分組的第一部有效影片
      const firstVideo = await prisma.video.findFirst({
        where: {
          groupIds: { has: group.id },
          deleted: false,
        },
        orderBy: [{ shootingDate: "desc" }, { publishedAt: "desc" }],
      });

      if (firstVideo?.thumbnail) {
        try {
          const res = await fetch(firstVideo.thumbnail, {
            headers: { "User-Agent": "VideoHub-OG-Bot/1.0" },
          });

          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const inputBuffer = Buffer.from(arrayBuffer);

            // 使用 sharp 裁切為 1200x630 JPEG
            const outputBuffer = await sharp(inputBuffer)
              .resize(1200, 630, { fit: "cover", position: "center" })
              .jpeg({ quality: 85 })
              .toBuffer();

            return new Response(outputBuffer as any, {
              headers: {
                "Content-Type": "image/jpeg",
                "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
              },
            });
          }
        } catch (fetchErr) {
          console.warn("[OG Route] Fetching video thumbnail failed, falling back to default:", fetchErr);
        }
      }
    }

    // Fallback 至預設 OG 圖片
    const defaultOgPath = path.join(process.cwd(), "public", "og-default.jpg");
    const defaultBuffer = await fs.readFile(defaultOgPath);

    return new Response(defaultBuffer as any, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("[OG Route Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
