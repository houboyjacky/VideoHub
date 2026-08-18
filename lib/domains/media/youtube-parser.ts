export type ChannelInputType = "channelId" | "handle" | "playlistId" | "unknown";

export interface ParsedChannelInput {
  type: ChannelInputType;
  value: string;
}

/**
 * 領域規則：從多元 YouTube 網址或識別碼中提取 11 碼 Video ID
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
 * 領域規則：解析使用者輸入的頻道網址、@Handle 或播放清單 ID
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

  // 2. 純播放清單 ID (PL, UU, FL 等開頭且長度超過 12 碼)
  if (/^(PL|UU|FL|RD|UL|LL|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { type: "playlistId", value: trimmed };
  }

  // 3. YouTube 頻道 @Handle 網址 (如 youtube.com/@channelName)
  const handleUrlMatch = trimmed.match(/youtube\.com\/@([a-zA-Z0-9_.-]+)/);
  if (handleUrlMatch && handleUrlMatch[1]) {
    return { type: "handle", value: handleUrlMatch[1] };
  }

  // 4. 純 @Handle 字串
  if (trimmed.startsWith("@")) {
    return { type: "handle", value: trimmed.substring(1) };
  }

  // 5. YouTube 頻道 ID 網址 (如 youtube.com/channel/UC...)
  const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/);
  if (channelUrlMatch && channelUrlMatch[1]) {
    return { type: "channelId", value: channelUrlMatch[1] };
  }

  // 6. 純 24 碼頻道 ID (UC 開頭)
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) {
    return { type: "channelId", value: trimmed };
  }

  return { type: "unknown", value: trimmed };
}
