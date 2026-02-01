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
