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
  WifiOff,
  Download,
  Upload,
  Trash2,
  RefreshCw
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

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

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

  const { isSyncing: isCardSyncing, autoSyncEnabled, toggleAutoSync } = useCardStore();

  // 初始化離線同步
  useOfflineSync();

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [googleInitError, setGoogleInitError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [syncConflict, setSyncConflict] = useState(null);

  // Dialog states
  const [showImportAlert, setShowImportAlert] = useState(false);
  const [showClearAlert, setShowClearAlert] = useState(false);
  const [pendingImportData, setPendingImportData] = useState(null);

  const currentRoadmap = getRoadmap(currentRoadmapId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const initGoogle = async () => {
      try {
        const { isGoogleConfigured, loadGoogleScripts, initVisibilityListener } = await import('@/lib/googleDrive');
        if (isGoogleConfigured()) {
          await loadGoogleScripts();
          setIsGoogleReady(true);

          // 初始化頁面可見性監聽（處理休眠喚醒）
          initVisibilityListener();
        }
      } catch (error) {
        console.error('在roadmap頁面，Google API 初始化失敗:', error);
        setGoogleInitError(true);
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
      if (error.code === 'cancelled' || error.message?.includes('closed by user')) {
        console.log('使用者取消登入');
      } else {
        console.error('登入失敗:', error);
        toast.error('登入失敗', { description: '請確認網路狀態或稍後再試' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { signOut } = await import('@/lib/googleDrive');
      signOut();
      setUser(null);
      toast.success('已登出');
    } catch (error) {
      console.error('登出失敗:', error);
      toast.error('登出失敗');
    }
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  // 下載雲端資料（可從衝突對話框或 dropdown 呼叫）
  const handleDownloadFromCloud = async () => {
    try {
      const { forceLoadFromCloud } = useCardStore.getState();
      if (syncConflict) {
        await forceLoadFromCloud(syncConflict.cloudData);
        setSyncConflict(null);
      } else {
        // 從 dropdown 直接下載
        const { loadFromCloud } = useCardStore.getState();
        await loadFromCloud();
      }
      toast.success('下載成功', { description: '已從雲端更新資料' });
    } catch (error) {
      console.error('下載雲端資料失敗:', error);
      toast.error('下載失敗', { description: error.message });
    }
  };

  // 上傳到雲端（可從衝突對話框或 dropdown 呼叫）
  const handleUploadToCloud = async () => {
    try {
      const { forceUploadToCloud } = useCardStore.getState();
      await forceUploadToCloud();
      if (syncConflict) {
        setSyncConflict(null);
      }
      toast.success('上傳成功', { description: '資料已保存至雲端' });
    } catch (error) {
      console.error('上傳到雲端失敗:', error);
      toast.error('上傳失敗', { description: error.message });
    }
  };

  // 手動刷新 Token
  const handleRefreshToken = async () => {
    try {
      const { refreshAccessToken } = await import('@/lib/googleDrive');

      await refreshAccessToken();
      console.log('[Header]  Token 手動刷新成功');

      toast.success('登入已更新', {
        description: 'Google 登入狀態已刷新'
      });
    } catch (error) {
      console.error('[Header]  Token 刷新失敗:', error);
      toast.error('登入更新失敗', {
        description: '請點擊右上角重新登入'
      });
    }
  };

  // 匯出資料
  const handleExportData = () => {
    try {
      const { cards, cardContents, projects, currentProjectId } = useCardStore.getState();
      const exportData = {
        cards,
        cardContents,
        projects,
        currentProjectId,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `knowledge-map-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('匯出成功', { description: '備份檔案已下載' });
    } catch (error) {
      console.error('匯出資料失敗:', error);
      toast.error('匯出失敗', { description: error.message });
    }
  };

  // 匯入資料 - 觸發檔案選擇
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = async (e) => {
      try {
        const file = e.target.files[0];
        if (!file) return;

        const text = await file.text();
        const importData = JSON.parse(text);

        if (!importData.cards) {
          throw new Error('無效的備份檔案格式');
        }

        setPendingImportData(importData);
        setShowImportAlert(true);
      } catch (error) {
        console.error('匯入資料失敗:', error);
        toast.error('匯入讀取失敗', { description: error.message });
      }
    };

    input.click();
  };

  // 確認匯入
  const confirmImport = () => {
    if (!pendingImportData) return;

    try {
      const { cards, cardContents, projects, currentProjectId } = pendingImportData;
      useCardStore.setState({
        cards: cards || {},
        cardContents: cardContents || {},
        projects: projects || { 'default': { id: 'default', name: '預設專案', icon: '📝' } },
        currentProjectId: currentProjectId || 'default'
      });

      toast.success('資料匯入成功');
    } catch (error) {
      console.error('匯入應用失敗:', error);
      toast.error('匯入失敗', { description: error.message });
    } finally {
      setShowImportAlert(false);
      setPendingImportData(null);
    }
  };

  // 清除本地資料 - 觸發確認
  const handleClearData = () => {
    setShowClearAlert(true);
  };

  // 確認清除
  const confirmClear = () => {
    try {
      // 清除 Zustand store
      useCardStore.setState({
        cards: {},
        cardContents: {},
        projects: {
          'default': {
            id: 'default',
            name: '預設專案',
            icon: '📝',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        currentProjectId: 'default',
        unsavedChanges: { metadata: false, contents: new Set() }
      });

      // 清除 localStorage 中的卡片內容
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('card-content-')) {
          localStorage.removeItem(key);
        }
      });

      toast.success('本地資料已清除');
    } catch (error) {
      console.error('清除資料失敗:', error);
      toast.error('清除失敗', { description: error.message });
    } finally {
      setShowClearAlert(false);
    }
  };

  // 同步狀態 icon
  const SyncStatusIcon = () => {
    if (isSyncing || isCardSyncing) return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
    if (isOffline) return <WifiOff className="w-3 h-3 text-orange-500" />;
    if (syncError) return <AlertCircle className="w-3 h-3 text-red-500" />;
    if (lastSyncTime) return <Cloud className="w-3 h-3 text-green-500" />;
    return <Cloud className="w-3 h-3 text-muted-foreground" />;
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-background via-background/70 to-transparent">
      <div className="mx-auto px-4 sm:px-6 py-4">
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
                <DropdownMenuContent align="end" className="w-64">
                  {/* 帳戶資訊 */}
                  {user?.name && (
                    <>
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium">{user.name}</p>
                        {user?.email && (
                          <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                        )}
                      </div>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {/* 雲端同步 */}
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">雲端同步</p>

                    {/* 自動同步開關 */}
                    <div className="flex items-center justify-between px-2 py-2 hover:bg-secondary rounded-md cursor-pointer" onClick={toggleAutoSync}>
                      <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        <span className="text-sm">自動同步</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors ${autoSyncEnabled ? 'bg-primary' : 'bg-secondary'} relative`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoSyncEnabled ? 'translate-x-4' : ''}`} />
                      </div>
                    </div>

                    <DropdownMenuItem onClick={handleRefreshToken}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      更新登入狀態
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleUploadToCloud} disabled={isCardSyncing}>
                      <Cloud className="w-4 h-4 mr-2" />
                      上傳到雲端
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDownloadFromCloud} disabled={isCardSyncing}>
                      <Cloud className="w-4 h-4 mr-2" />
                      下載雲端資料
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator />

                  {/* 資料管理 */}
                  <div className="px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 py-1">資料管理</p>
                    <DropdownMenuItem onClick={handleExportData}>
                      <Download className="w-4 h-4 mr-2" />
                      匯出資料
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleImportData}>
                      <Upload className="w-4 h-4 mr-2" />
                      匯入資料
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleClearData}
                      className="text-red-500 focus:text-red-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      清除本地資料
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500">
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={isLoading ? () => setIsLoading(false) : handleSignIn}
                disabled={!isGoogleReady}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isLoading
                  ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  } disabled:opacity-50`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="hidden sm:inline">取消</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {isGoogleReady ? '登入' : (googleInitError ? '僅限離線模式' : '設定中...')}
                    </span>
                  </>
                )}
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

      {/* 匯入確認對話框 */}
      <AlertDialog open={showImportAlert} onOpenChange={setShowImportAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要匯入資料嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              匯入將會完全覆蓋現有的本地資料。此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowImportAlert(false); setPendingImportData(null); }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport} className="bg-primary">
              確認匯入
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 清除確認對話框 */}
      <AlertDialog open={showClearAlert} onOpenChange={setShowClearAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要清除所有資料嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              這將刪除所有本地存儲的卡片、專案和內容。此操作無法撤銷。
              <br /><br />
              建議您先匯出備份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearAlert(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-red-600 hover:bg-red-700">
              確認清除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}