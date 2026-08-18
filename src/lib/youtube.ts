import { google } from "googleapis";

const youtube = google.youtube("v3");

export interface VideoMetadataResult {
  ytId: string;
  title: string;
  description?: string;
  thumbnail: string;
  publishedAt: Date;
  ytPrivacyStatus?: string;
}

export type ChannelInputType = "channelId" | "handle" | "playlistId" | "unknown";

export interface ParsedChannelInput {
  type: ChannelInputType;
  value: string;
}

/**
 * 從多元 YouTube 網址或識別碼中提取 11 碼 Video ID
 */
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== "string") return null;

  const trimmed = urlOrId.trim();

  // 若直接是 11 碼影片 ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // 匹配常見 YouTube 網址格式
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
    /^https?:\/\/(?:www\.)?youtube\.com\/live\/([\w-]{11})/,
  ];

  for (const regex of patterns) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * 解析使用者輸入的頻道網址、@Handle 或播放清單 ID
 */
export function parseChannelOrPlaylistInput(input: string): ParsedChannelInput {
  if (!input || typeof input !== "string") {
    return { type: "unknown", value: "" };
  }

  const trimmed = input.trim();

  // 1. 播放清單網址匹配 (含有 list=PL...)
  const playlistMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch && playlistMatch[1]) {
    return { type: "playlistId", value: playlistMatch[1] };
  }

  // 2. 純播放清單 ID (PL, UU, FL 等開頭)
  if (/^(PL|UU|FL|LL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { type: "playlistId", value: trimmed };
  }

  // 3. 頻道 ID 網址匹配 (含有 /channel/UC...)
  const channelUrlMatch = trimmed.match(/\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelUrlMatch && channelUrlMatch[1]) {
    return { type: "channelId", value: channelUrlMatch[1] };
  }

  // 4. 純頻道 ID (UC 開頭且長度為 24 碼)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: "channelId", value: trimmed };
  }

  // 5. 頻道 Handle 網址匹配 (含有 /@handle)
  const handleUrlMatch = trimmed.match(/\/@([a-zA-Z0-9_.-]+)/);
  if (handleUrlMatch && handleUrlMatch[1]) {
    return { type: "handle", value: `@${handleUrlMatch[1]}` };
  }

  // 6. 純 Handle (以 @ 開頭)
  if (/^@[a-zA-Z0-9_.-]+$/.test(trimmed)) {
    return { type: "handle", value: trimmed };
  }

  // 7. 預設當作 handle
  return { type: "handle", value: `@${trimmed.replace(/^@/, "")}` };
}

/**
 * 自動獲取「我的頻道」或指定頻道/播放清單的上傳清單資訊
 */
export async function fetchMyChannelUploadsInfo(
  accessToken?: string,
  targetInput?: string
): Promise<{ uploadsPlaylistId: string; channelTitle: string; channelId: string }> {
  // 1. 若有 OAuth Access Token 且未指定特定目標，優先調用 mine: true 直接自動抓取自己登入的 YouTube 頻道！
  if (accessToken && !targetInput) {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const yt = google.youtube({ version: "v3", auth: oauth2Client });
      const res = await yt.channels.list({
        mine: true,
        part: ["snippet", "contentDetails"],
      });
      const item = res.data.items?.[0];
      if (item && item.contentDetails?.relatedPlaylists?.uploads) {
        return {
          uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
          channelTitle: item.snippet?.title || "我的 YouTube 頻道",
          channelId: item.id || "",
        };
      }
    } catch (err) {
      console.warn("[YouTube API] OAuth mine: true fetch failed, falling back to target input:", err);
    }
  }

  // 2. 否則調用 API Key 與 target 解析
  return fetchChannelUploadsInfo(targetInput || "");
}

/**
 * 透過 YouTube Data API v3 獲取頻道上傳播放清單 ID 與頻道資訊
 */
export async function fetchChannelUploadsInfo(
  input: string
): Promise<{ uploadsPlaylistId: string; channelTitle: string; channelId: string }> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("系統未設定 YOUTUBE_API_KEY 環境變數");
  }

  const parsed = parseChannelOrPlaylistInput(input);

  // 如果直接是播放清單 ID
  if (parsed.type === "playlistId") {
    try {
      const plRes = await youtube.playlists.list({
        key: apiKey,
        part: ["snippet"],
        id: [parsed.value],
      });
      const plItem = plRes.data.items?.[0];
      return {
        uploadsPlaylistId: parsed.value,
        channelTitle: plItem?.snippet?.title || `播放清單 (${parsed.value})`,
        channelId: plItem?.snippet?.channelId || "",
      };
    } catch {
      return {
        uploadsPlaylistId: parsed.value,
        channelTitle: `播放清單 (${parsed.value})`,
        channelId: "",
      };
    }
  }

  // 透過頻道 ID 或代稱查詢頻道
  const params: any = {
    key: apiKey,
    part: ["snippet", "contentDetails"],
  };

  if (parsed.type === "channelId") {
    params.id = [parsed.value];
  } else {
    params.forHandle = parsed.value.replace(/^@/, "");
  }

  const res = await youtube.channels.list(params);
  let item = res.data.items?.[0];

  if (!item && parsed.type === "handle") {
    const userRes = await youtube.channels.list({
      key: apiKey,
      part: ["snippet", "contentDetails"],
      forUsername: parsed.value.replace(/^@/, ""),
    });
    item = userRes.data.items?.[0];
  }

  if (!item) {
    throw new Error(`找不到指定的 YouTube 頻道或播放清單: ${input}`);
  }

  const uploadsPlaylistId = item.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) {
    throw new Error("無法取得該頻道的影片上傳清單 (Uploads Playlist)");
  }

  return {
    uploadsPlaylistId,
    channelTitle: item.snippet?.title || "未命名頻道",
    channelId: item.id || parsed.value,
  };
}

/**
 * 分頁遞迴取得播放清單/頻道上傳清單中的全部影片 (包含私人影片與 OAuth 補全)
 */
export async function fetchAllVideosFromPlaylist(
  playlistId: string,
  maxTotal: number = 1000,
  accessToken?: string
): Promise<VideoMetadataResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const auth = accessToken
    ? (() => {
        const o = new google.auth.OAuth2();
        o.setCredentials({ access_token: accessToken });
        return o;
      })()
    : undefined;

  const ytClient = auth ? google.youtube({ version: "v3", auth }) : youtube;
  const videos: VideoMetadataResult[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const params: any = {
      part: ["snippet", "status", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken,
    };
    if (!auth) {
      params.key = apiKey;
    }

    const res: any = await ytClient.playlistItems.list(params);

    const items = res.data.items || [];
    for (const item of items) {
      const snippet = item.snippet;
      const ytId = item.contentDetails?.videoId || snippet?.resourceId?.videoId;
      if (!ytId || snippet?.title === "Deleted video") {
        continue;
      }

      const isPrivate =
        item.status?.privacyStatus === "private" ||
        snippet?.title === "Private video" ||
        snippet?.title === "私人影片";

      const title =
        snippet?.title && snippet.title !== "Private video"
          ? snippet.title
          : "私人影片";

      const thumbnails = snippet?.thumbnails;
      const thumbnail =
        thumbnails?.maxres?.url ||
        thumbnails?.standard?.url ||
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`;

      videos.push({
        ytId,
        title,
        description: snippet?.description || "",
        thumbnail,
        publishedAt: snippet?.publishedAt
          ? new Date(snippet.publishedAt)
          : item.contentDetails?.videoPublishedAt
          ? new Date(item.contentDetails.videoPublishedAt)
          : new Date(),
        ytPrivacyStatus: isPrivate ? "private" : item.status?.privacyStatus || "unlisted",
      });

      if (videos.length >= maxTotal) break;
    }

    pageToken = res.data.nextPageToken;
  } while (pageToken && videos.length < maxTotal);

  // 透過 videos.list 批次補全真實元資料與精準隱私狀態
  if (videos.length > 0) {
    try {
      const idChunks: string[][] = [];
      for (let i = 0; i < videos.length; i += 50) {
        idChunks.push(videos.slice(i, i + 50).map((v) => v.ytId));
      }

      for (const chunk of idChunks) {
        const detailParams: any = {
          part: ["snippet", "status"],
          id: chunk,
        };
        if (!auth) {
          detailParams.key = apiKey;
        }

        const detailRes = await ytClient.videos.list(detailParams);
        const detailItems = detailRes.data.items || [];
        for (const dItem of detailItems) {
          const vIndex = videos.findIndex((v) => v.ytId === dItem.id);
          if (vIndex !== -1 && dItem.snippet) {
            const dSnippet = dItem.snippet;
            const dThumbnails = dSnippet.thumbnails;
            const dThumb =
              dThumbnails?.maxres?.url ||
              dThumbnails?.standard?.url ||
              dThumbnails?.high?.url ||
              dThumbnails?.medium?.url ||
              dThumbnails?.default?.url;

            if (dSnippet.title) {
              videos[vIndex].title = dSnippet.title;
            }
            if (dSnippet.description) {
              videos[vIndex].description = dSnippet.description;
            }
            if (dThumb) {
              videos[vIndex].thumbnail = dThumb;
            }
            if (dSnippet.publishedAt) {
              videos[vIndex].publishedAt = new Date(dSnippet.publishedAt);
            }
            if (dItem.status?.privacyStatus) {
              videos[vIndex].ytPrivacyStatus = dItem.status.privacyStatus;
            }
          }
        }
      }
    } catch (detailErr) {
      console.warn("[YouTube API Detail Enrichment Warning]:", detailErr);
    }
  }

  return videos;
}

/**
 * 透過 OAuth search(forMine: true) 與 videos.list 獲取頻道中的私人影片與缺漏影片
 */
export async function fetchMyPrivateVideos(
  accessToken: string,
  existingYtIds: Set<string>
): Promise<VideoMetadataResult[]> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const yt = google.youtube({ version: "v3", auth: oauth2Client });

  const privateVideos: VideoMetadataResult[] = [];
  const candidateIds: string[] = [];

  try {
    let pageToken: string | undefined = undefined;
    do {
      const searchRes: any = await yt.search.list({
        part: ["id", "snippet"],
        forMine: true,
        type: ["video"],
        maxResults: 50,
        pageToken,
      });

      const items = searchRes.data.items || [];
      for (const item of items) {
        const vid = item.id?.videoId;
        if (vid && !existingYtIds.has(vid)) {
          candidateIds.push(vid);
        }
      }
      pageToken = searchRes.data.nextPageToken;
    } while (pageToken && candidateIds.length < 200);

    if (candidateIds.length > 0) {
      for (let i = 0; i < candidateIds.length; i += 50) {
        const chunk = candidateIds.slice(i, i + 50);
        const vRes = await yt.videos.list({
          id: chunk,
          part: ["snippet", "status"],
        });

        for (const item of vRes.data.items || []) {
          if (!item.id || item.snippet?.title === "Deleted video") continue;

          const snippet = item.snippet;
          const status = item.status;
          const thumbnails = snippet?.thumbnails;
          const thumbnail =
            thumbnails?.maxres?.url ||
            thumbnails?.standard?.url ||
            thumbnails?.high?.url ||
            thumbnails?.medium?.url ||
            thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

          privateVideos.push({
            ytId: item.id,
            title: snippet?.title || "私人影片",
            description: snippet?.description || "",
            thumbnail,
            publishedAt: snippet?.publishedAt ? new Date(snippet.publishedAt) : new Date(),
            ytPrivacyStatus: status?.privacyStatus || "private",
          });
        }
      }
    }
  } catch (err) {
    console.warn("[YouTube API] fetchMyPrivateVideos failed:", err);
  }

  return privateVideos;
}

/**
 * 透過 YouTube Data API v3 或 oEmbed 獲取單部影片元資料
 */
export async function fetchVideoMetadata(
  urlOrId: string
): Promise<VideoMetadataResult> {
  const videoId = extractYouTubeId(urlOrId);
  if (!videoId) {
    throw new Error("無效的 YouTube 影片網址或 ID");
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  // 1. 若有 YouTube API Key，呼叫官方 Data API v3
  if (apiKey) {
    try {
      const res = await youtube.videos.list({
        key: apiKey,
        part: ["snippet", "status"],
        id: [videoId],
      });

      const item = res.data.items?.[0];
      if (!item || !item.snippet) {
        throw new Error("在 YouTube 上找不到該影片，可能已被刪除或設為私人");
      }

      const snippet = item.snippet;
      const status = item.status;

      const thumbnails = snippet.thumbnails;
      const thumbnail =
        thumbnails?.maxres?.url ||
        thumbnails?.standard?.url ||
        thumbnails?.high?.url ||
        thumbnails?.medium?.url ||
        thumbnails?.default?.url ||
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      return {
        ytId: videoId,
        title: snippet.title || "未命名影片",
        description: snippet.description || "",
        thumbnail,
        publishedAt: snippet.publishedAt ? new Date(snippet.publishedAt) : new Date(),
        ytPrivacyStatus: status?.privacyStatus || "unlisted",
      };
    } catch (err: unknown) {
      console.warn(
        `[YouTube API Warning] API Key fetch failed, attempting oEmbed fallback:`,
        err
      );
    }
  }

  // 2. Fallback: 使用 YouTube 免費 oEmbed API 獲取標題與縮圖
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      throw new Error("無法取得 YouTube 影片資料");
    }
    const data = await res.json();

    return {
      ytId: videoId,
      title: data.title || "未命名影片",
      description: `作者: ${data.author_name || "YouTube"}`,
      thumbnail:
        data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: new Date(),
      ytPrivacyStatus: "unlisted",
    };
  } catch (oembedErr) {
    return {
      ytId: videoId,
      title: `YouTube 影片 (${videoId})`,
      description: "",
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      publishedAt: new Date(),
      ytPrivacyStatus: "unlisted",
    };
  }
}

/**
 * 批次獲取多部 YouTube 影片的元資料與狀態 (供 cron 定時排程使用)
 */
export async function fetchMultipleVideosMetadata(
  videoIds: string[]
): Promise<Map<string, { title?: string; thumbnail?: string; ytPrivacyStatus?: string; notFound?: boolean }>> {
  const result = new Map<string, { title?: string; thumbnail?: string; ytPrivacyStatus?: string; notFound?: boolean }>();
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey || videoIds.length === 0) {
    return result;
  }

  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    try {
      const res = await youtube.videos.list({
        key: apiKey,
        part: ["snippet", "status"],
        id: chunk,
      });

      const foundIds = new Set<string>();
      for (const item of res.data.items || []) {
        if (!item.id || !item.snippet) continue;
        foundIds.add(item.id);

        const snippet = item.snippet;
        const thumbnails = snippet.thumbnails;
        const thumbnail =
          thumbnails?.maxres?.url ||
          thumbnails?.standard?.url ||
          thumbnails?.high?.url ||
          thumbnails?.medium?.url ||
          thumbnails?.default?.url ||
          `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

        result.set(item.id, {
          title: snippet.title || undefined,
          thumbnail,
          ytPrivacyStatus: item.status?.privacyStatus || "unlisted",
          notFound: false,
        });
      }

      for (const id of chunk) {
        if (!foundIds.has(id)) {
          result.set(id, { notFound: true });
        }
      }
    } catch (err) {
      console.warn("[YouTube API] fetchMultipleVideosMetadata chunk failed:", err);
    }
  }

  return result;
}
