import withPWA from '@ducanh2912/next-pwa';

// GitHub Pages 部署設定
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repoName = '/roadmap'; // 你的 repo 名稱

const pwaConfig = withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 支援 Turbopack (Next.js 16+)
  turbopack: {},

  // 靜態導出 (GitHub Pages 需要)
  output: 'export',

  // 子路徑設定 (部署到 username.github.io/roadmap)
  basePath: isGitHubPages ? repoName : '',
  assetPrefix: isGitHubPages ? repoName : '',

  // 確保每個路由都有 index.html (避免 404)
  trailingSlash: true,

  // 圖片優化 (靜態導出不支援，需關閉)
  images: {
    unoptimized: true,
  },
};

export default pwaConfig(nextConfig);
