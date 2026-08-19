# VideoHub (JackyStream) 部署與維護手冊

本專案使用 **Docker Compose** 封裝 **Next.js 16 (Turbopack) Standalone** 應用，並設定 `restart: unless-stopped` 達成開機自動啟動與守護，前端透過 **Nginx** 搭配 SSL 進行反向代理。

---

## 1. 服務架構概覽

```text
[使用者 / 訪客] 
   │
   ▼
[Cloudflare CDN Proxy (Orange Cloud ☁️)] 
   │ HTTPS :443
   ▼
[Nginx 反向代理 (SSL Termination + Security Headers)]
   │ Proxy to http://127.0.0.1:<PORT> (預設 26789)
   ▼
[VideoHub Next.js 16 Docker Container (network_mode: host / restart: unless-stopped)]
   │ MongoDB 驅動直連 (原生原子操作)
   ▼
[MongoDB 資料庫 (本地 Port 26748 或 Docker 容器 27017)]
```

---

## 2. 日常維護常用指令

### 啟動、停止與重啟服務 (透過 Docker Compose)

```bash
# 啟動並在背景運行（開機將自動啟動）
docker compose up -d

# 停止服務
docker compose down

# 重啟服務
docker compose restart

# 查看容器運行狀態
docker compose ps
```

### 查看應用程式即時日誌 (Logs)

```bash
# 查看本地實體日誌檔案 (自動每日 Rotate 永遠保存)
tail -f logs/auth.log
tail -f logs/app.log
tail -f logs/error.log

# 查看 Docker Container 即時輸出
docker compose logs -f
```

---

## 3. 程式碼更新與重新部署流程

當有更新程式碼時，在專案目錄執行：

```bash
cd /path/to/MyShareWeb

# 重新建置映像檔並在背景重啟
docker compose up -d --build
```

---

## 4. 🧪 容器化端到端測試 (Standalone Docker E2E)

若需驗證獨立 Docker Compose（拉起獨立 MongoDB 容器模擬全新冷啟動、健康檢查與連線）：

```bash
# 執行自動化 Standalone Docker E2E 測試腳本
./scripts/test-docker-standalone.sh
```

---

## 5. 定期排程任務 (Cron Job)

系統提供 API 端點每日定時同步 YouTube 全頻道最新影片與影片狀態：

```bash
# 每日凌晨 02:00 自動觸發同步 (加入 crontab)
0 2 * * * curl -X POST https://your-domain.com/api/cron/sync-videos -H "Authorization: Bearer <YOUR_CRON_SECRET>" > /dev/null 2>&1
```

---

## 6. Nginx 設定維護

可參考本專案 `nginx/videohub.conf.sample` 範本進行設定，並 Symlink 至 `/etc/nginx/sites-available/` 與 `/etc/nginx/sites-enabled/`。

若修改了 Nginx 設定檔：
```bash
# 測試語法
sudo nginx -t

# 平滑重新載入 (不中斷現有連線)
sudo systemctl reload nginx
```
