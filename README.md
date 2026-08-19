# 🎬 VideoHub (JackyStream)

<div align="center">

![VideoHub Logo](/public/logo.svg)

### 專為個人頻道、摯友與家庭打造的現代化私人影音串流分享平台

[![Next.js](https://img.shields.io/badge/Next.js-16.3.1-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![DDD Architecture](https://img.shields.io/badge/Architecture-DDD_5_Domains-blueviolet?style=flat-square)](src/lib/domains/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)
[![TDD Tests](https://img.shields.io/badge/TDD_Tests-135%2F135_Passed-success?style=flat-square&logo=node.js)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 專案簡介 (Introduction)

**VideoHub** 是一個基於 **Next.js 16 (App Router / Turbopack)**、**DDD 領域驅動架構 (Domain-Driven Design)**、**TailwindCSS** 與 **MongoDB** 打造的現代化私有影音分享系統。解決創作者或個人將大量生活紀錄、教學、活動影片上傳至 YouTube 後，希望依據「**家人**」、「**大學同學**」、「**特定社團**」等不同社交圈進行**細緻權限隔離觀看**的需求。

全站支援**完全自訂品牌名稱與外觀**（透過 `.env.local` 或管理後台動態設定，支援即時切換全站名稱、管理員稱呼與聯絡資訊）。

透過 Google OAuth 2.0 與 YouTube Data API v3 深度整合，站長可一鍵將頻道內的所有影片（包含**公開**、**不公開**與**私人**）自動匯入並分類，訪客可透過智慧邀請碼或公開展示頁加入，並享有全方位的權限隔離與串流保護。

---

## ✨ 核心特色 (Key Features)

### 1. 🏛️ DDD 領域驅動架構 (Domain-Driven Design)
專案全面收納至 `src/` 目錄，嚴格劃分 5 大高內聚業務領域與 Application Use Cases：
- **Identity 領域**：使用者狀態機（`unregistered` ➜ `pending` ➜ `approved` / `rejected` ➜ `disabled`）、個人稱呼合法性校驗、動態管理員策略。
- **Invitation 領域**：邀請碼生命週期與安全刪除規則（先停用方可刪除）、5 次輸錯鎖定 15 分鐘雙重防暴力 Rate Limiter。
- **Media 領域**：10 碼 URL-Safe 不可預測隨機短 ID、YouTube 網址/清單/@Handle 解析器。
- **Audit 領域**：永久全量審計活動日誌保存、全域型別化設定讀取器 `AuditConfig`、OS/瀏覽器 User-Agent 與 IP 解析。
- **Notification 領域**：郵件發送抽象層（Gmail SMTP + Resend 雙引擎自動 Fallback）、歡迎信與測試信 HTML 模板。

### 2. ⚙️ 管理後台全域動態設定 (`/admin/settings`)
- **網頁端即時配置**：管理員可直接於後台修改網站名稱、管理員稱呼、YouTube API Key、SMTP/Resend 郵件密鑰與安全限流策略，**免重啟 Docker 容器即時生效**。
- **三層優先級解析（Hierarchy Fallback）**：遵循「1. 後台資料庫設定 ➜ 2. `.env.local` ➜ 3. 系統內建預設值」，支援「留空即自動回退」。
- **安全金鑰遮罩與一鍵測試**：機密金鑰支援眼睛切換明文/密文（未修改自動保留原密碼），並提供「🧪 寄送測試信」即時驗證發信連線。

### 3. 🎟️ 智慧邀請碼與 10 碼不可預測分組展示頁
- **智慧邀請碼 (Smart Invite Codes)**：支援 `autoApprove: true` 免審核直通註冊並自動綁定分組，背景發送開通歡迎信。
- **分組公開展示頁 (`/share/group/[shareId]`)**：採用 10 碼隨機 `shareId`，未授權用戶呈現 Teaser 毛玻璃縮圖遮罩與大型 CTA，並支援 Sharp 動態裁切 1200×630 OG 社群分享卡片。
- **已登入會員分組兌換**：支援以 Union 邏輯增量追加分組，不覆蓋舊權限。

### 4. 🔄 YouTube 全頻道智慧增量同步
- **一鍵自動識別**：透過 OAuth `mine: true` 自動連結站長 YouTube 頻道，免手動輸入複雜的 Channel ID。
- **全隱私層級收錄**：支援 **公開 (Public)**、**不公開 (Unlisted)** 與 **私人 (Private)** 影片的完整元資料同步。
- **自訂資料防覆蓋**：同步時僅更新標題、縮圖與建立日期，**絕不覆蓋**站長手動設定的群組分類與標籤。

### 5. 👥 人員管理中心與安全審核
- **即時模糊搜尋**：支援姓名、Email、邀請碼來源即時過濾。
- **帳號停用與刪除保護**：一鍵切換停用（被停用帳號即刻攔截導向 `/auth/disabled`），並提供二次勾選確認防誤刪保護。

### 6. 💎 極致視覺與互動體驗 (Glassmorphism UI)
- **多版面切換**：支援經典「水平橫卡」與「網格圖卡 (Grid)」一鍵無縫切換。
- **多維度動態篩選 Chips**：狀態篩選（公開/不公開/私人）、年份倒序統計 Chips、標籤交集搜尋。
- **倍數分頁載入**：以 3 的倍數分頁載入（`PAGE_SIZE = 12`），提供平滑微動態與載入指示器。

### 7. 🛡️ 全路徑 135 項 TDD 自動化測試保障
- 內建 **135 項全套測試套件** (`npm test`) 100% 綠燈通過，涵蓋：
  - DDD 5 大領域純邏輯單元測試與 UseCase 回歸測試
  - YouTube 解析與識別碼提取單元測試
  - MongoDB 原生資料層與原子查詢測試
  - Proxy 全路徑 5 角色權限跳轉矩陣與停用攔截
  - 防暴力破解限流與日誌防清空保護測試
  - Standalone Docker 內建 Mongo 容器端到端整合測試 (`scripts/test-docker-standalone.sh`)

---

## 🏗️ 系統架構 (Architecture)

```mermaid
graph TD
    User([使用者 / 訪客]) -->|HTTPS / 443| Nginx[Nginx 反向代理 & SSL]
    Nginx -->|Port 26789| NextApp[Next.js 16 Web 服務容器 (src/)]

    subgraph Core [應用層 & DDD 領域]
        NextApp --> Proxy[src/proxy.ts 路由網關]
        Proxy --> NextAuth[src/auth.ts NextAuth v5 Google OAuth]
        NextApp --> UseCases[src/lib/application/ 用例層]
        UseCases --> Domains[src/lib/domains/ 5 大業務領域模型]
    end

    subgraph Data [資料與外部整合]
        Domains --> MongoDB[(MongoDB 7.0 資料庫)]
        Domains --> YouTubeAPI[YouTube Data API v3]
        Domains --> Mailer[Gmail SMTP / Resend 郵件服務]
    end
```

---

## 📂 專案目錄結構 (Project Structure)

```text
專案根目錄/
├── ⚙️ [工程工具與環境設定]
│   ├── .env.local                    # 本地環境變數 (process.env 注入)
│   ├── .env.local.example            # 三級階梯式環境變數範本
│   ├── package.json                  # 套件依賴與版本 (v1.1.16)
│   ├── tsconfig.json                 # TypeScript 設定 (@/* -> ./src/*)
│   ├── next.config.ts                # Next.js 框架配置
│   ├── postcss.config.mjs            # PostCSS / Tailwind CSS 4 設定
│   ├── eslint.config.mjs             # ESLint 程式碼檢查規範
│   ├── Dockerfile                    # Multi-stage 輕量化映像檔建置
│   └── docker-compose.yml            # 生產容器編排 (支援 host / 雙模式)
│
├── 📂 [靜態資源與測試套件]
│   ├── public/                       # 靜態圖片、Favicon
│   ├── prisma/                       # 資料庫結構與模型
│   ├── tests/                        # 135 項單元、安全與整合測試
│   └── scripts/                      # 維護腳本與 Standalone Docker E2E 測試
│
└── 🌟 [100% 業務原始碼 - 完整收納至 src/]
    ├── app/                          # Next.js App Router 頁面與 API 路由
    ├── components/                   # UI 視圖組件、Modals、卡片
    ├── lib/                          # DDD 領域層 (domains/) 與 Use Cases (application/)
    ├── auth.ts                       # NextAuth 認證適配器
    ├── auth.config.ts                # NextAuth 邊緣安全設定
    ├── proxy.ts                      # 全域路由與權限網關
    └── types/                        # TypeScript 全域型別宣告
```

---

## 🚀 快速開始 (Getting Started)

### 1. 環境需求
- **Node.js** >= 20.x
- **Docker** & **Docker Compose**
- **MongoDB** (本機或 Docker 內建容器)
- **Google Cloud Console** 憑證（已啟用 Google OAuth 2.0 與 YouTube Data API v3）

### 2. 安裝依賴
```bash
git clone https://github.com/houboyjacky/VideoHub.git
cd VideoHub
npm install
```

### 3. 設定環境變數
複製範本並填入必要金鑰（範本已劃分為三級階梯結構）：
```bash
cp .env.local.example .env.local
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
執行全套 135 項單元、安全與整合測試。

---

## 🐳 生產環境部署 (Docker Deployment)

本專案採用 Docker Compose 進行容器化部署，具備自動重啟與健康檢查：

```bash
# 建置並在背景啟動容器
docker compose up -d --build

# 檢查運行日誌
docker compose logs -f
```

---

## 📄 開源授權 (License)

本專案採用 [MIT License](LICENSE) 條款開源發布，歡迎自由使用、修改、分發或商業應用。
