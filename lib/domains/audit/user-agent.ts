export interface ParsedClientInfo {
  os: string;
  browser: string;
  device: string;
}

/**
 * 領域規則：從 User-Agent 字串中安全解析作業系統、瀏覽器與裝置類型
 */
export function parseUserAgent(userAgent?: string | null): ParsedClientInfo {
  if (!userAgent || typeof userAgent !== "string") {
    return {
      os: "未知系統",
      browser: "未知瀏覽器",
      device: "Desktop",
    };
  }

  const ua = userAgent;

  // 1. 作業系統辨識 (OS Detection)
  let os = "其他系統";
  if (/windows phone/i.test(ua)) {
    os = "Windows Phone";
  } else if (/windows nt 10\.0/i.test(ua)) {
    os = "Windows 10/11";
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = "Windows 8.1";
  } else if (/windows nt 6\.2/i.test(ua)) {
    os = "Windows 8";
  } else if (/windows nt 6\.1/i.test(ua)) {
    os = "Windows 7";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os (\d+[_\d]*)/i);
    const version = match ? match[1].replace(/_/g, ".") : "";
    os = /ipad/i.test(ua) ? `iPadOS ${version}`.trim() : `iOS ${version}`.trim();
  } else if (/macintosh|mac os x/i.test(ua)) {
    const match = ua.match(/mac os x (\d+[_\d]*)/i);
    const version = match ? match[1].replace(/_/g, ".") : "";
    os = `macOS ${version}`.trim();
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android (\d+[\.\d]*)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/cros/i.test(ua)) {
    os = "ChromeOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  // 2. 瀏覽器辨識 (Browser Detection)
  let browser = "其他瀏覽器";
  if (/edg\//i.test(ua)) {
    const match = ua.match(/edg\/(\d+[\.\d]*)/i);
    browser = match ? `Edge ${match[1].split(".")[0]}` : "Edge";
  } else if (/opr\/|opera\//i.test(ua)) {
    const match = ua.match(/(?:opr|opera)\/(\d+[\.\d]*)/i);
    browser = match ? `Opera ${match[1].split(".")[0]}` : "Opera";
  } else if (/chrome|crios/i.test(ua) && !/edge|edg|opr/i.test(ua)) {
    const match = ua.match(/(?:chrome|crios)\/(\d+[\.\d]*)/i);
    browser = match ? `Chrome ${match[1].split(".")[0]}` : "Chrome";
  } else if (/firefox|fxios/i.test(ua)) {
    const match = ua.match(/(?:firefox|fxios)\/(\d+[\.\d]*)/i);
    browser = match ? `Firefox ${match[1].split(".")[0]}` : "Firefox";
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    const match = ua.match(/version\/(\d+[\.\d]*)/i);
    browser = match ? `Safari ${match[1].split(".")[0]}` : "Safari";
  }

  // 3. 裝置類型辨識 (Device Detection)
  let device = "Desktop";
  if (/tablet|ipad/i.test(ua) || (os.includes("Android") && !/mobile/i.test(ua))) {
    device = "Tablet";
  } else if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) {
    device = "Mobile";
  }

  return {
    os,
    browser,
    device,
  };
}

/**
 * 從請求標頭中提取客戶端真實 IP 位址
 */
export function extractClientIp(
  headers?: Headers | Request | Record<string, string | string[] | undefined> | null
): string {
  if (!headers) return "127.0.0.1";

  let forwarded: string | null = null;
  let realIp: string | null = null;

  if (typeof (headers as Headers).get === "function") {
    forwarded = (headers as Headers).get("x-forwarded-for");
    realIp = (headers as Headers).get("x-real-ip");
  } else if ((headers as any).headers && typeof (headers as any).headers.get === "function") {
    forwarded = (headers as any).headers.get("x-forwarded-for");
    realIp = (headers as any).headers.get("x-real-ip");
  } else {
    const h = headers as Record<string, any>;
    forwarded = h["x-forwarded-for"] || h["X-Forwarded-For"] || null;
    realIp = h["x-real-ip"] || h["X-Real-IP"] || null;
  }

  if (forwarded) {
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }

  if (realIp) {
    return realIp.trim();
  }

  return "127.0.0.1";
}
