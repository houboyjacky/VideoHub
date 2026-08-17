export interface ParsedClientInfo {
  os: string;
  browser: string;
  device: string;
}

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

  // 3. 裝置類型 (Device Type)
  let device = "Desktop";
  if (/mobile|iphone|ipod|android.*mobile/i.test(ua)) {
    device = "Mobile";
  } else if (/tablet|ipad|android(?!.*mobile)/i.test(ua)) {
    device = "Tablet";
  }

  return { os, browser, device };
}

export function extractClientIp(req?: Request | Headers | null): string {
  if (!req) return "127.0.0.1";

  let headers: Headers;
  if (req instanceof Headers) {
    headers = req;
  } else if ("headers" in req) {
    headers = req.headers;
  } else {
    return "127.0.0.1";
  }

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 0 && ips[0]) return ips[0];
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}
