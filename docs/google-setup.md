# Google Cloud Console 設定指引手冊

本文件協助你完成 **Google OAuth 2.0 登入** 與 **YouTube Data API v3** 的憑證申請。

---

## 步驟一：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 點擊頂部專案選單，點擊 **「新增專案」 (New Project)**。
3. 專案名稱輸入：`VideoHub`，點擊 **「建立」**。

---

## 步驟二：設定 OAuth 同意畫面 (OAuth Consent Screen)

1. 在左側選單進入 **「API 和服務」 > 「OAuth 同意畫面」**。
2. User Type 選擇 **「外部 (External)」**，點擊 **「建立」**。
3. 填寫應用程式基本資訊：
   - **應用程式名稱**：`VideoHub`
   - **使用者支援電子郵件**：選擇你的 Gmail
   - **開發人員聯絡資訊**：填入你的 Gmail
4. 範圍 (Scopes)：
   - 點擊 **「儲存並繼續」**（預設的 email, profile, openid 即可）。
5. 測試使用者 (Test Users)：
   - 在尚未將應用發布為「正式運作 (Production)」之前，點擊 **「ADD USERS」** 將你與朋友的 Gmail 加入測試名單中。
6. 完成後點擊 **「回到資訊主頁」**。

---

## 步驟三：建立 OAuth 2.0 用戶端 ID (Client ID)

1. 在左側選單進入 **「憑證」 (Credentials)**。
2. 點擊頂部 **「+ 建立憑證」 > 「OAuth 用戶端 ID」**。
3. **應用程式類型**：選擇 **「網頁應用程式」 (Web Application)**。
4. **名稱**：輸入 `VideoHub Web Client`。
5. **已授權的 JavaScript 來源 (Authorized JavaScript origins)**：
   - `http://localhost:3000`（本地測試）
   - `https://your-domain.com`（線上正式）
6. **已授權的重新導向 URI (Authorized redirect URIs)**：
   - `http://localhost:3000/api/auth/callback/google`（本地測試）
   - `https://your-domain.com/api/auth/callback/google`（線上正式）
7. 點擊 **「建立」**。
8. 複製產生的 **用戶端 ID (Client ID)** 與 **用戶端密碼 (Client Secret)**。

---

## 步驟四：啟用 YouTube Data API v3 並取得 API 金鑰

1. 在左側選單進入 **「已啟用的 API 和服務」 > 「+ 啟用 API 和服務」**。
2. 搜尋 `YouTube Data API v3`，點擊並點選 **「啟用」 (Enable)**。
3. 啟用後，回到 **「憑證」** 頁面。
4. 點擊頂部 **「+ 建立憑證」 > 「API 金鑰」 (API Key)**。
5. 複製生成的 API Key。
6. *(可選安全建議)* 點擊編輯該金鑰，在「API 限制」中選擇「限制金鑰」，只勾選 `YouTube Data API v3`。

---

## 步驟五：填入專案環境變數 (`.env.local`)

將上述取得的金鑰填入專案根目錄的 `.env.local`：

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=你的用戶端ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-你的用戶端密碼

# YouTube Data API v3
YOUTUBE_API_KEY=AIzaSy你的API金鑰
```

完成後儲存，重啟服務即可生效！
