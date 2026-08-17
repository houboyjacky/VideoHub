# 🎬 VideoHub

<div align="center">

![VideoHub Logo](/public/logo.svg)

### 專為個人頻道、摯友與家庭打造的現代化私人影音串流分享平台

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![TDD Tests](https://img.shields.io/badge/TDD_Tests-66%2F66_Passed-success?style=flat-square&logo=node.js)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 專案簡介 (Introduction)

**VideoHub** 是一個基於 **Next.js 16 (App Router)**、**TailwindCSS** 與 **MongoDB** 打造的現代化私有影音分享系統。解決創作者或個人將大量生活紀錄、教學、活動影片上傳至 YouTube 後，希望依據「**家人**」、「**大學同學**」、「**特定社團**」等不同社交圈進行**細緻權限隔離觀看**的需求。

平台支援**完全自訂品牌名稱**（透過環境變數 `NEXT_PUBLIC_APP_NAME`，可隨時自訂替換為您的專屬站點名稱）。

透過 Google OAuth 2.0 與 YouTube Data API v3 深度整合，站長可一鍵將頻道內的所有影片（包含**公開**、**不公開**與**私人**）自動匯入並分類，訪客需憑邀請碼註冊並由管理員審核通過後，方可依照被指派的分組權限解鎖對應的專屬影音內容。

---

## ✨ 核心特色 (Key Features)

### 1. 🏷️ 支援自訂平台品牌名稱
- **環境變數動態配置**：可透過 `.env.local` 的 `NEXT_PUBLIC_APP_NAME` 隨意切換全站標題、導航列、登入頁與通知信件名稱（預設為 `VideoHub`，亦可設定為任意專屬名稱）。

### 2. 🔄 YouTube 全頻道智慧增量同步
- **一鍵自動識別**：透過 OAuth `mine: true` 自動連結站長 YouTube 頻道，免手動輸入複雜的 Channel ID。
- **全隱私層級收錄**：支援 **公開 (Public)**、**不公開 (Unlisted)** 與 **私人 (Private)** 影片的完整元資料同步。
- **自訂資料防覆蓋**：同步時僅更新標題、縮圖與建立日期，**絕不覆蓋**站長手動設定的群組分類與標籤。
- **防誤刪保護**：針對私人影片建立 API 穿透防護，避免因外部未授權查詢誤判為已刪除。

### 3. 👥 細緻分組與動態權限隔離
- **群組隔離**：可自訂多個分組（如：公開、家人、大學好友、登山隊等），影片與會員皆可綁定多個群組。
- **原子解關聯**：後台分組刪除採用 MongoDB `$pull` 原子操作，瞬間安全解除關聯，不留孤兒數據。
- **五大角色路由跳轉矩陣**：未登入訪客 (Guest)、未註冊 (Unregistered)、待審核 (Pending)、已核准會員 (Approved)、站長 (Admin) 嚴密隔離。

### 4. 🎟️ 邀請碼機制與會員審核流
- **邀請碼生命週期**：支援設定「使用次數上限」與「有效截止日期」，隨時可一鍵停用。
- **防刷限流與審核**：註冊後進入待審核狀態，站長可於後台一鍵「通過」或「拒絕」，並可搭配 SMTP 發送通知信件。

### 5. 💎 極致視覺與互動體驗 (Glassmorphism UI)
- **多版面切換**：預設採用經典「**左圖 右描述**」水平橫卡佈局，亦支援一鍵切換為「**網格圖卡 (Grid)**」。
- **動態統計篩選 Chips**：
  - 🌐 狀態篩選：`全部`、`🌐 公開`、`🔗 不公開`、`🔒 私人`
  - 📅 年份篩選：依影片年份自動統計並倒序排列
  - 🏷️ 分組與標籤：支援即時關鍵字搜尋與多維度交集篩選
- **倍數分頁載入**：以 3 的倍數分頁載入（`PAGE_SIZE = 12`），提供「載入更多」與「顯示全部」按鈕。

### 6. 🛡️ 全路徑 TDD 自動化測試保障
- 內建 **66 項自動化測試套件** (`npm test`)，涵蓋：
  - YouTube 解析與識別碼提取單元測試
  - MongoDB 原生資料層與原子查詢測試
  - Proxy 全路徑 5 角色權限跳轉矩陣
  - 後台 API 403 阻擋真機測試
  - Cron 定時排程 Bearer Secret 安全檢驗
  - 邀請碼用罄/過期/停用邊界條件整合測試

---

## 🏗️ 系統架構 (Architecture)

```mermaid
graph TD
    User([使用者 / 訪客]) -->|HTTPS / 443| Nginx[Nginx 反向代理 & SSL]
    Nginx -->|Port 3000| NextApp[Next.js 16 Web 服務容器]

    subgraph Core [應用層 & 安全防護]
        NextApp --> Proxy[Proxy 路由矩陣]
        Proxy --> NextAuth[NextAuth.js v5 Google OAuth]
        NextApp --> AdminAPI[後台 API requireAdmin 驗證]
    end

    subgraph Data [資料與整合層]
        NextApp --> MongoDB[(MongoDB 7.0 - Port 27017)]
        NextApp --> YouTubeAPI[YouTube Data API v3]
        NextApp --> Mailer[Nodemailer SMTP]
    end
```

---

## 🚀 快速開始 (Getting Started)

### 1. 環境需求
- **Node.js** >= 20.x
- **Docker** & **Docker Compose**
- **MongoDB** (本機或 Docker 容器)
- **Google Cloud Console** 憑證（已啟用 YouTube Data API v3）

### 2. 安裝依賴
```bash
git clone https://github.com/houboyjacky/VideoHub.git
cd VideoHub
npm install
```

### 3. 設定環境變數
複製範本並填入必要金鑰：
```bash
cp .env.local.example .env.local
```

編輯 `.env.local`：
```env
# 平台自訂品牌名稱 (預設: VideoHub，可自訂為任意專屬名稱)
NEXT_PUBLIC_APP_NAME=VideoHub

# 站點 URL 與金鑰
NEXTAUTH_URL=https://your-videohub.domain.com
AUTH_SECRET=your_random_auth_secret_here

# Google OAuth 2.0 (已啟用 youtube.readonly scope)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key

# 站長 Email 清單 (以逗號分隔)
ADMIN_EMAILS=your_email@gmail.com

# MongoDB 連線字串
MONGODB_URI=mongodb://user:password@localhost:27017/videohub?authSource=videohub

# Cron 排程安全密鑰
CRON_SECRET=your_secure_cron_secret
```

### 4. 本地開發
```bash
npm run dev
```
瀏覽器開啟 `http://localhost:3000`（或自訂連接埠）即可進入系統。

### 5. 執行測試
```bash
npm test
```

---

## 🐳 生產環境部署 (Docker Deployment)

本專案採用純 Docker Compose 進行容器化部署，具備自動重啟與健康檢查：

```bash
# 建置並在背景啟動容器
docker compose up -d --build

# 檢查運行日誌
docker compose logs -f
```

---

## 📂 專案目錄結構 (Project Structure)

```text
├── app/                  # Next.js App Router 頁面與 API 路由
│   ├── admin/            # 後台管理頁面 (影片/用戶/群組/邀請碼)
│   ├── api/              # 後端 REST API (認證、註冊、管理、Cron)
│   ├── feed/             # 會員專屬影音動態牆
│   ├── video/[id]/       # 影音播放頁面
│   └── page.tsx          # 登入與首頁入口
├── components/           # UI 元件 (VideoCard, FilterBar, Navbar 等)
├── lib/                  # 核心商業邏輯 (YouTube API, Prisma/Mongo, Auth, Email)
├── prisma/               # Prisma Schema (僅作型別定義)
├── tests/                # TDD 自動化測試套件 (Unit, Integration, Security)
├── .continuity/          # Project Continuity 跨 Agent 記憶與決策庫
├── docker-compose.yml    # Docker Compose 部署配置
├── Dockerfile            # Multi-stage 輕量化映像檔建置
└── proxy.ts              # Next.js 16 路由代理與安全攔截
```

---

## 📄 開源授權 (License)

本專案採用 [MIT License](LICENSE) 條款開源發布，歡迎自由使用、修改、分發或商業應用。
