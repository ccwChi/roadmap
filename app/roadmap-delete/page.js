'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SettingsPanel from '@/components/SettingsPanel';
import MusicPlayer from '@/components/MusicPlayer';

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
    </main>
  );
}
