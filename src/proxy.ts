import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user;

  // 靜態資源與公開 API/頁面直通
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/api/share") ||
    pathname.startsWith("/api/og") ||
    pathname.startsWith("/auth/disabled") ||
    pathname.includes(".") // favicon, images, etc.
  ) {
    return NextResponse.next();
  }

  const isLoggedIn = !!user;
  const status = user?.status;
  const isAdmin = !!user?.isAdmin;
  const disabled = !!user?.disabled;

  // 0. 帳號停用攔截
  if (isLoggedIn && disabled && pathname !== "/auth/disabled") {
    return NextResponse.redirect(new URL("/auth/disabled", req.url));
  }

  // 1. 管理後台保護 (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return NextResponse.next();
  }

  // 2. 影片牆與播放頁保護 (/feed, /video/*)
  if (pathname.startsWith("/feed") || pathname.startsWith("/video")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (status === "pending" || status === "rejected") {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    return NextResponse.next();
  }

  // 3. 註冊頁保護 (/register)
  if (pathname.startsWith("/register")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (status === "approved") {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    if (status === "pending" || status === "rejected") {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    return NextResponse.next();
  }

  // 4. 待審核頁保護 (/pending)
  if (pathname.startsWith("/pending")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    if (status === "approved") {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return NextResponse.next();
  }

  // 5. 首頁 (/) 訪客公開
  if (pathname === "/") {
    if (isLoggedIn && status === "approved") {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    if (isLoggedIn && status === "unregistered") {
      return NextResponse.redirect(new URL("/register", req.url));
    }
    if (isLoggedIn && (status === "pending" || status === "rejected")) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
