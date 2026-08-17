import { test, describe } from "node:test";
import assert from "node:assert/strict";

/**
 * 模擬 Proxy / Middleware 的路徑跳轉判定邏輯
 */
function evaluateRouteAccess(
  pathname: string,
  user: { isLoggedIn: boolean; status?: string; isAdmin?: boolean } | null
): { action: "next" | "redirect"; destination?: string } {
  // 靜態資源與認證 API 直通
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.includes(".")
  ) {
    return { action: "next" };
  }

  const isLoggedIn = !!user?.isLoggedIn;
  const status = user?.status;
  const isAdmin = !!user?.isAdmin;

  // 1. 管理後台保護 (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return { action: "redirect", destination: "/" };
    }
    if (!isAdmin) {
      return { action: "redirect", destination: "/feed" };
    }
    return { action: "next" };
  }

  // 2. 影片牆與播放頁保護 (/feed, /video/*)
  if (pathname.startsWith("/feed") || pathname.startsWith("/video")) {
    if (!isLoggedIn) {
      return { action: "redirect", destination: "/" };
    }
    if (status === "unregistered") {
      return { action: "redirect", destination: "/register" };
    }
    if (status === "pending" || status === "rejected") {
      return { action: "redirect", destination: "/pending" };
    }
    return { action: "next" };
  }

  // 3. 註冊頁保護 (/register)
  if (pathname.startsWith("/register")) {
    if (!isLoggedIn) {
      return { action: "redirect", destination: "/" };
    }
    if (status === "approved") {
      return { action: "redirect", destination: "/feed" };
    }
    if (status === "pending" || status === "rejected") {
      return { action: "redirect", destination: "/pending" };
    }
    return { action: "next" };
  }

  // 4. 待審核頁保護 (/pending)
  if (pathname.startsWith("/pending")) {
    if (!isLoggedIn) {
      return { action: "redirect", destination: "/" };
    }
    if (status === "approved") {
      return { action: "redirect", destination: "/feed" };
    }
    return { action: "next" };
  }

  // 5. 首頁 (/) 訪客公開與登入後重導向
  if (pathname === "/") {
    if (isLoggedIn && status === "approved") {
      return { action: "redirect", destination: "/feed" };
    }
    if (isLoggedIn && status === "unregistered") {
      return { action: "redirect", destination: "/register" };
    }
    if (isLoggedIn && (status === "pending" || status === "rejected")) {
      return { action: "redirect", destination: "/pending" };
    }
  }

  return { action: "next" };
}

describe("全頁面路由權限攔截與跳轉矩陣測試 (Security: Proxy Route Matrix)", () => {
  describe("角色一：未登入訪客 (Guest)", () => {
    const guest = null;

    test("首頁 (/) 允許存取", () => {
      assert.deepEqual(evaluateRouteAccess("/", guest), { action: "next" });
    });

    test("隱私權政策 (/privacy) 允許公開存取", () => {
      assert.deepEqual(evaluateRouteAccess("/privacy", guest), { action: "next" });
    });

    test("服務條款 (/terms) 允許公開存取", () => {
      assert.deepEqual(evaluateRouteAccess("/terms", guest), { action: "next" });
    });

    test("關於與 API 說明 (/about) 允許公開存取", () => {
      assert.deepEqual(evaluateRouteAccess("/about", guest), { action: "next" });
    });

    test("影片動態牆 (/feed) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/feed", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("影片播放頁 (/video/123) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/video/123", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台首頁 (/admin) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台影片管理 (/admin/videos) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin/videos", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台用戶管理 (/admin/users) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin/users", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台分組管理 (/admin/groups) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin/groups", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台邀請碼管理 (/admin/invite-codes) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin/invite-codes", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台郵件設定 (/admin/email) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin/email", guest), {
        action: "redirect",
        destination: "/",
      });
    });

    test("管理後台活動日誌 (/admin/logs) 應重導向至首頁 (/)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin/logs", guest), {
        action: "redirect",
        destination: "/",
      });
    });
  });

  describe("角色二：已登入未註冊訪客 (Unregistered User)", () => {
    const unreg = { isLoggedIn: true, status: "unregistered", isAdmin: false };

    test("存取首頁 (/) 應導向註冊填碼頁 (/register)", () => {
      assert.deepEqual(evaluateRouteAccess("/", unreg), {
        action: "redirect",
        destination: "/register",
      });
    });

    test("存取註冊頁 (/register) 允許存取", () => {
      assert.deepEqual(evaluateRouteAccess("/register", unreg), {
        action: "next",
      });
    });

    test("存取動態牆 (/feed) 應導向註冊填碼頁 (/register)", () => {
      assert.deepEqual(evaluateRouteAccess("/feed", unreg), {
        action: "redirect",
        destination: "/register",
      });
    });

    test("存取後台 (/admin) 應拒絕並導向動態牆 (/feed)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin", unreg), {
        action: "redirect",
        destination: "/feed",
      });
    });
  });

  describe("角色三：待審核會員 (Pending User)", () => {
    const pending = { isLoggedIn: true, status: "pending", isAdmin: false };

    test("存取首頁 (/) 應導向審核等待頁 (/pending)", () => {
      assert.deepEqual(evaluateRouteAccess("/", pending), {
        action: "redirect",
        destination: "/pending",
      });
    });

    test("存取動態牆 (/feed) 應導向審核等待頁 (/pending)", () => {
      assert.deepEqual(evaluateRouteAccess("/feed", pending), {
        action: "redirect",
        destination: "/pending",
      });
    });

    test("存取待審核頁 (/pending) 允許存取", () => {
      assert.deepEqual(evaluateRouteAccess("/pending", pending), {
        action: "next",
      });
    });

    test("存取後台 (/admin) 應拒絕並導向動態牆 (/feed)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin", pending), {
        action: "redirect",
        destination: "/feed",
      });
    });
  });

  describe("角色四：已核准一般會員 (Approved Normal User)", () => {
    const approved = { isLoggedIn: true, status: "approved", isAdmin: false };

    test("存取首頁 (/) 應自動前往動態牆 (/feed)", () => {
      assert.deepEqual(evaluateRouteAccess("/", approved), {
        action: "redirect",
        destination: "/feed",
      });
    });

    test("存取動態牆 (/feed) 允許正常瀏覽", () => {
      assert.deepEqual(evaluateRouteAccess("/feed", approved), {
        action: "next",
      });
    });

    test("存取播放頁 (/video/123) 允許正常觀看", () => {
      assert.deepEqual(evaluateRouteAccess("/video/123", approved), {
        action: "next",
      });
    });

    test("嘗試存取後台各頁 (/admin, /admin/videos, /admin/users) 應一律封鎖並導向 (/feed)", () => {
      assert.deepEqual(evaluateRouteAccess("/admin", approved), {
        action: "redirect",
        destination: "/feed",
      });
      assert.deepEqual(evaluateRouteAccess("/admin/videos", approved), {
        action: "redirect",
        destination: "/feed",
      });
      assert.deepEqual(evaluateRouteAccess("/admin/users", approved), {
        action: "redirect",
        destination: "/feed",
      });
      assert.deepEqual(evaluateRouteAccess("/admin/groups", approved), {
        action: "redirect",
        destination: "/feed",
      });
      assert.deepEqual(evaluateRouteAccess("/admin/invite-codes", approved), {
        action: "redirect",
        destination: "/feed",
      });
    });
  });

  describe("角色五：系統管理員 (Admin User)", () => {
    const admin = { isLoggedIn: true, status: "approved", isAdmin: true };

    test("管理後台所有路徑均允許正常進入", () => {
      assert.deepEqual(evaluateRouteAccess("/admin", admin), { action: "next" });
      assert.deepEqual(evaluateRouteAccess("/admin/videos", admin), { action: "next" });
      assert.deepEqual(evaluateRouteAccess("/admin/users", admin), { action: "next" });
      assert.deepEqual(evaluateRouteAccess("/admin/groups", admin), { action: "next" });
      assert.deepEqual(evaluateRouteAccess("/admin/invite-codes", admin), { action: "next" });
    });
  });
});
