'use client';

import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SettingsPanel from "@/components/SettingsPanel";
import Sidebar from "@/components/Sidebar";
import { Toaster } from 'sonner';

export default function RootLayout({ children }) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <title>AI Roadmap - 學習路線圖</title>
        <meta name="description" content="互動式 AI 學習路線圖，支援進度追蹤、筆記功能與 Google Drive 同步" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href={`${basePath}/manifest.json`} />
        <link rel="icon" type="image/png" sizes="192x192" href={`${basePath}/icons/icon-192x192.png`} />
        <link rel="icon" type="image/x-icon" href={`${basePath}/favicon.ico`} />
        <link rel="apple-touch-icon" sizes="192x192" href={`${basePath}/icons/icon-192x192.png`} />
        <link rel="apple-touch-icon" sizes="512x512" href={`${basePath}/icons/icon-512x512.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AI Roadmap" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
          <SettingsPanel />
          <Sidebar />
          <Toaster position="bottom-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
