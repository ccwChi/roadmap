'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import MusicPlayer from '@/components/MusicPlayer';
import { Home, Moon, Sun } from 'lucide-react';

const RoadmapFlow = dynamic(() => import('@/components/RoadmapFlow'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">載入路線圖中...</p>
      </div>
    </div>
  ),
});

export default function RoadmapPage() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background">
      <Header />
      <Sidebar />
      <SettingsPanel />
      <RoadmapFlow />
      <MusicPlayer />

      {/* Fixed buttons */}
      <div className="fixed top-20 left-6 z-10 flex flex-col gap-2">
        <Link
          href="/"
          className="p-3 rounded-full bg-card border border-border shadow-lg hover:bg-secondary transition-colors"
          aria-label="返回首頁"
        >
          <Home className="w-5 h-5 text-foreground" />
        </Link>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-card/90 backdrop-blur-md border border-border rounded-lg p-4 shadow-xl hidden lg:block">
        <h3 className="text-sm font-semibold text-foreground mb-3">類別</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-amber-400 bg-amber-400/10"></div>
            <span className="text-xs text-muted-foreground">基礎</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500/10"></div>
            <span className="text-xs text-muted-foreground">核心概念</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-emerald-500 bg-emerald-500/10"></div>
            <span className="text-xs text-muted-foreground">技能</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-purple-500 bg-purple-500/10"></div>
            <span className="text-xs text-muted-foreground">進階</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-2 border-pink-500 bg-pink-500/10"></div>
            <span className="text-xs text-muted-foreground">應用</span>
          </div>
        </div>
      </div>
    </main>
  );
}
