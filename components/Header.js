'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCardStore } from '@/store/useCardStore';
import SyncConflictDialog from './SyncConflictDialog';

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

  const { isSyncing: isCardSyncing } = useCardStore();

  // 初始化離線同步
  useOfflineSync();

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncConflict, setSyncConflict] = useState(null);

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
        console.error('在roadmap頁面，Google API 初始化失敗:', error);
      }
    };
    initGoogle();
  }, []);

  const handleSignIn = async () => {
    if (!isGoogleReady) return;
    setIsLoading(true);
    try {
      const { signIn, waitForGoogleApiReady } = await import('@/lib/googleDrive');
      const userInfo = await signIn();

      await waitForGoogleApiReady(10000);
      setUser(userInfo);

      // 確保真的有 Token 才載入
      if (window.gapi?.client?.getToken()) {
        const { loadFromCloud } = useCardStore.getState();
        const result = await loadFromCloud();

        // 檢查是否有衝突
        if (result?.conflict) {
          setSyncConflict(result);
        }
      } else {
        throw new Error('登入後無法取得 Token');
      }
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

  const handleDownloadFromCloud = async () => {
    if (!syncConflict) return;
    const { forceLoadFromCloud } = useCardStore.getState();
    await forceLoadFromCloud(syncConflict.cloudData);
    setSyncConflict(null);
  };

  const handleUploadToCloud = async () => {
    if (!syncConflict) return;
    const { forceUploadToCloud } = useCardStore.getState();
    await forceUploadToCloud();
    setSyncConflict(null);
  };

  // 同步狀態 icon
  const SyncStatusIcon = () => {
    if (isSyncing || isCardSyncing) return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
    if (isOffline) return <WifiOff className="w-3 h-3 text-orange-500" />;
    if (syncError) return <AlertCircle className="w-3 h-3 text-red-500" />;
    if (lastSyncTime) return <Cloud className="w-3 h-3 text-green-500" />;
    return <CloudOff className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-background via-background/70 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left - Menu + Progress */}
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              aria-label="開啟選單"
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            {/* <div className="flex-1 max-w-xs">
              <div className="text-sm font-medium text-foreground mb-1">
                {currentRoadmap?.icon} {currentRoadmap?.title || 'AI Roadmap'}
              </div>
              <ProgressBar compact />
            </div> */}
          </div>

          {/* Right - Login or User Menu */}
          <div className="flex items-center gap-2">
            {isSignedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-secondary transition-colors">
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
                    <SyncStatusIcon />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {user?.name && (
                    <>
                      <div className="px-2 py-1.5 text-sm font-medium">{user.name}</div>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={toggleTheme}>
                    {mounted && resolvedTheme === 'dark' ? (
                      <Sun className="w-4 h-4 mr-2" />
                    ) : (
                      <Moon className="w-4 h-4 mr-2" />
                    )}
                    {mounted && resolvedTheme === 'dark' ? '淺色模式' : '深色模式'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    設定
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
      </div>

      {/* 同步衝突對話框 */}
      <SyncConflictDialog
        open={!!syncConflict}
        onOpenChange={(open) => !open && setSyncConflict(null)}
        cloudLastModified={syncConflict?.cloudData?.lastModified}
        localLastModified={syncConflict?.localLastModified}
        onDownloadFromCloud={handleDownloadFromCloud}
        onUploadToCloud={handleUploadToCloud}
      />
    </header>
  );
}