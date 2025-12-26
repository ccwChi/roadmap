部署到 GitHub Pages
步驟 1：合併 PR 到 main 分支
先將目前的修改合併到 main 分支（建立 PR 或直接合併）。

步驟 2：設定 GitHub Repository
到你的 GitHub Repo → Settings → Pages：

Source: 選擇 GitHub Actions
不需要選擇分支，workflow 會自動處理
步驟 3：設定 Secrets（Google Drive 同步用）
到 Settings → Secrets and variables → Actions → New repository secret：

Secret 名稱	值
GOOGLE_CLIENT_ID	你的 Google OAuth Client ID
GOOGLE_API_KEY	你的 Google API Key
如果不需要 Google Drive 同步，可以跳過這步。

步驟 4：觸發部署
部署會在以下情況自動執行：

推送到 main 分支時
手動觸發（到 Actions → Deploy to GitHub Pages → Run workflow）
部署後的網址
https://ccwChi.github.io/roadmap/

本地測試 Production Build
# 模擬 GitHub Pages 環境
GITHUB_PAGES=true npm run build

# 本地預覽（需要安裝 serve）
npx serve out

重要設定說明
你的 next.config.mjs 已經正確設定：

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName = '/roadmap';

// 部署到 GitHub Pages 時會自動設定 basePath
basePath: isGitHubPages ? repoName : '',
assetPrefix: isGitHubPages ? repoName : '',

這確保所有資源路徑在 username.github.io/roadmap/ 下正確運作。

PWA 在 GitHub Pages 上的注意事項
HTTPS - GitHub Pages 自動提供 HTTPS，PWA 需要 HTTPS 才能運作
Service Worker - 會在 build 時自動生成到 /out 目錄
manifest.json - 已設定正確的路徑