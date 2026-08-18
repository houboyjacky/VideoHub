import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * 模擬包含 v1.1.0 分享頁、OG 路由與停用攔截的 Proxy 路由判斷
 */
function evaluateShareAndAuthProxy(
  pathname: string,
  user: { isLoggedIn: boolean; status?: string; isAdmin?: boolean; disabled?: boolean } | null
): { action: "next" | "redirect"; destination?: string } {
  // 靜態資源與開放公開路由直通
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/api/share") ||
    pathname.startsWith("/api/og") ||
    pathname.startsWith("/auth/disabled") ||
    pathname.includes(".")
  ) {
    return { action: "next" };
  }

  const isLoggedIn = !!user?.isLoggedIn;
  const status = user?.status;
  const isAdmin = !!user?.isAdmin;
  const disabled = !!user?.disabled;

  // 0. 帳號停用攔截
  if (isLoggedIn && disabled) {
    return { action: "redirect", destination: "/auth/disabled" };
  }

  // 1. 管理後台保護
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) return { action: "redirect", destination: "/" };
    if (!isAdmin) return { action: "redirect", destination: "/feed" };
    return { action: "next" };
  }

  // 2. 影片牆保護
  if (pathname.startsWith("/feed") || pathname.startsWith("/video")) {
    if (!isLoggedIn) return { action: "redirect", destination: "/" };
    if (status === "unregistered") return { action: "redirect", destination: "/register" };
    if (status === "pending" || status === "rejected") return { action: "redirect", destination: "/pending" };
    return { action: "next" };
  }

  // 3. 註冊頁保護
  if (pathname.startsWith("/register")) {
    if (!isLoggedIn) return { action: "redirect", destination: "/" };
    if (status === "approved") return { action: "redirect", destination: "/feed" };
    if (status === "pending" || status === "rejected") return { action: "redirect", destination: "/pending" };
    return { action: "next" };
  }

  // 4. 首頁訪客直通
  if (pathname === "/") {
    if (isLoggedIn && status === "approved") return { action: "redirect", destination: "/feed" };
    if (isLoggedIn && status === "unregistered") return { action: "redirect", destination: "/register" };
    if (isLoggedIn && (status === "pending" || status === "rejected")) return { action: "redirect", destination: "/pending" };
  }

  return { action: "next" };
}

describe("分組展示頁與帳號停用路由權限矩陣測試 (Security: Share Page & Disabled Matrix)", () => {
  test("未登入訪客存取 /share/group/[shareId] 應直通允許公開瀏覽", () => {
    const res = evaluateShareAndAuthProxy("/share/group/aB3k9xPq2R", null);
    assert.equal(res.action, "next");
  });

  test("未登入訪客存取 /api/share/group/[shareId] 應直通允許取得展示資料", () => {
    const res = evaluateShareAndAuthProxy("/api/share/group/aB3k9xPq2R", null);
    assert.equal(res.action, "next");
  });

  test("社群爬蟲存取 /api/og/group/[shareId] 應直通允許生成 OG 圖片", () => {
    const res = evaluateShareAndAuthProxy("/api/og/group/aB3k9xPq2R", null);
    assert.equal(res.action, "next");
  });

  test("已登入會員存取 /share/group/[shareId] 亦應直通允許預覽與兌換", () => {
    const res = evaluateShareAndAuthProxy("/share/group/aB3k9xPq2R", {
      isLoggedIn: true,
      status: "approved",
    });
    assert.equal(res.action, "next");
  });

  test("已停用帳號 (disabled: true) 嘗試存取任何受保護頁面應被導向 /auth/disabled", () => {
    const res = evaluateShareAndAuthProxy("/feed", {
      isLoggedIn: true,
      status: "approved",
      disabled: true,
    });
    assert.equal(res.action, "redirect");
    assert.equal(res.destination, "/auth/disabled");
  });

  test("訪客或停用用戶存取 /auth/disabled 提示頁應直通允許", () => {
    const res = evaluateShareAndAuthProxy("/auth/disabled", {
      isLoggedIn: true,
      disabled: true,
    });
    assert.equal(res.action, "next");
  });
});
