/**
 * 歡迎信 HTML 模板生成器
 */
export function buildWelcomeEmailHtml(params: {
  userName: string;
  adminName: string;
  appName: string;
  groupName?: string;
  loginUrl: string;
}): string {
  const { userName, adminName, appName, groupName, loginUrl } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .header { text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: 700; color: #38bdf8; margin: 0; }
    .content { line-height: 1.6; font-size: 16px; color: #cbd5e1; }
    .badge { display: inline-block; background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 12px; font-weight: 600; margin-top: 24px; }
    .footer { margin-top: 32px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #334155; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">歡迎加入</div>
      <h1 class="title">${appName}</h1>
    </div>
    <div class="content">
      <p>親愛的 <strong>${userName}</strong> 您好：</p>
      <p>歡迎您加入 <strong>${appName}</strong>！您的邀請碼已成功驗證並開通帳號權限${groupName ? `，已為您自動指派分組：<strong>${groupName}</strong>` : ""}。</p>
      <p>現在您可以點擊下方按鈕直接登入平台，開始觀賞專屬影音內容：</p>
      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn" target="_blank">立即前往平台 ➜</a>
      </div>
      <p style="margin-top: 24px;">祝您觀影愉快！</p>
      <p>敬祝 順心<br><strong>${adminName}</strong> 敬上</p>
    </div>
    <div class="footer">
      <p>此信件由 ${appName} 系統自動發送，請勿直接回覆。</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 測試信 HTML 模板生成器
 */
export function buildTestEmailHtml(params: {
  adminName: string;
  appName: string;
  testedAt: string;
  provider: string;
}): string {
  const { adminName, appName, testedAt, provider } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }
    .container { max-width: 550px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #10b981; padding: 32px; }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px; }
    .title { font-size: 22px; font-weight: 700; color: #34d399; margin: 12px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge">🟢 連線測試成功</div>
    <h1 class="title">${appName} 郵件系統測試</h1>
    <p>管理員 <strong>${adminName}</strong> 您好：</p>
    <p>這是一封來自 <strong>${appName}</strong> 後台系統設定的測試信件。</p>
    <p>恭喜您！當前的郵件發送服務已成功連線並正常運行。</p>
    <ul>
      <li>發信引擎：<strong>${provider}</strong></li>
      <li>測試時間：<strong>${testedAt}</strong></li>
    </ul>
  </div>
</body>
</html>
  `.trim();
}
