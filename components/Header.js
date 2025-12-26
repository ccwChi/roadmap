'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Sparkles,
  Menu,
  User,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  Settings,
  Loader2,
  Moon,
  Sun,
  AlertCircle,
  WifiOff
} from 'lucide-react';
import { useStore, useUIStore } from '@/store/useStore';
import { getRoadmap } from '@/data/roadmaps';
import ProgressBar from './ProgressBar';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function Header() {
  const { toggleSidebar, setSettingsOpen } = useUIStore();
  const {
    user,
    isSignedIn,
    setUser,
    isSyncing,
    lastSyncTime,
    syncError,
    isOffline,
    pendingSyncCount,
    loadFromCloud,
    currentRoadmapId,
  } = useStore();

  // 初始化離線同步
  useOfflineSync();

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentRoadmap = getRoadmap(currentRoadmapId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const initGoogle = async () => {
      try {
        const { isGoogleConfigured, loadGoogleScripts } = await import('@/lib/googleDrive');
        if (isGoogleConfigured()) {
          await loadGoogleScripts();
          setIsGoogleReady(true);
        }
      } catch (error) {
        console.error('Google API 初始化失敗:', error);
      }
    };
    initGoogle();
  }, []);

  const handleSignIn = async () => {
    if (!isGoogleReady) return;
    setIsLoading(true);
    try {
      const { signIn } = await import('@/lib/googleDrive');
      const userInfo = await signIn();
      setUser(userInfo);
      await loadFromCloud();
    } catch (error) {
      console.error('登入失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/googleDrive');
      signOut();
      setUser(null);
    } catch (error) {
      console.error('登出失敗:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-background via-background/95 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="開啟選單"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-foreground">
                  {currentRoadmap?.icon} {currentRoadmap?.title || 'AI Roadmap'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {currentRoadmap?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="hidden md:block flex-1 max-w-md mx-4">
            <ProgressBar />
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {isSignedIn && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-xs" title={syncError || ''}>
                {isSyncing ? (
                  <>
                    <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    <span className="text-muted-foreground hidden sm:inline">同步中...</span>
                  </>
                ) : isOffline ? (
                  <>
                    <WifiOff className="w-3 h-3 text-orange-500" />
                    <span className="text-orange-500 hidden sm:inline">
                      離線{pendingSyncCount > 0 ? ` (${pendingSyncCount})` : ''}
                    </span>
                  </>
                ) : syncError ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-red-500 hidden sm:inline">同步失敗</span>
                  </>
                ) : lastSyncTime ? (
                  <>
                    <Cloud className="w-3 h-3 text-green-500" />
                    <span className="text-muted-foreground hidden sm:inline">已同步</span>
                  </>
                ) : (
                  <>
                    <CloudOff className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground hidden sm:inline">未同步</span>
                  </>
                )}
              </div>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="切換主題"
            >
              {mounted && (
                resolvedTheme === 'dark' ? (
                  <Sun className="w-5 h-5 text-foreground" />
                ) : (
                  <Moon className="w-5 h-5 text-foreground" />
                )
              )}
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="設定"
            >
              <Settings className="w-5 h-5 text-foreground" />
            </button>

            {isSignedIn ? (
              <div className="flex items-center gap-2">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full border-2 border-border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  aria-label="登出"
                >
                  <LogOut className="w-4 h-4 text-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleSignIn}
                disabled={!isGoogleReady || isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {!isGoogleReady ? '設定中...' : '登入'}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="md:hidden mt-3">
          <ProgressBar />
        </div>
      </div>
    </header>
  );
}