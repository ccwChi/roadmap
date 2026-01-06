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
  // 自定義 Service Worker
  customWorkerSrc: 'worker',
  customWorkerDest: 'public',
  customWorkerPrefix: 'worker',
  workboxOptions: {
    disableDevLogs: true,
    // 預快取關鍵資源
    additionalManifestEntries: [
      { url: '/', revision: null },
      { url: '/manifest.json', revision: null },
    ],
    // 執行時期快取策略
    runtimeCaching: [
      {
        // Google Fonts
        urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 年
          },
        },
      },
      {
        // 靜態資源
        urlPattern: /\.(?:js|css|woff2?)$/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 24 * 60 * 60, // 24 小時
          },
        },
      },
      {
        // 圖片
        urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天
          },
        },
      },
    ],
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

  // 明確設定環境變數（靜態導出需要）
  env: {
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_GOOGLE_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
    NEXT_PUBLIC_BASE_PATH: isGitHubPages ? repoName : '',
  },
};

export default pwaConfig(nextConfig);
