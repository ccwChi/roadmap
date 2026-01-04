'use client';

import { useState, useEffect } from 'react';
import { Trash2, Download, Upload, Cloud, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { useStore, useUIStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  loadGoogleScripts,
  signIn,
  signOut,
  isGoogleConfigured,
} from '@/lib/googleDrive';

export default function SettingsPanel() {
  const { settingsOpen, setSettingsOpen } = useUIStore();
  const {
    user,
    isSignedIn,
    setUser,
    settings,
    updateSettings,
    resetAll,
    loadFromCloud,
    isSyncing,
    lastSyncTime,
    progress,
    notes
  } = useStore();

  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState(false);

  // 載入 Google API
  useEffect(() => {
    if (settingsOpen && !isGoogleReady) {
      const initGoogle = async () => {
        const configured = isGoogleConfigured();
        setGoogleConfigured(configured);

        if (configured) {
          try {
            await loadGoogleScripts();
            setIsGoogleReady(true);
          } catch (error) {
            console.error('Google API 載入失敗:', error);
          }
        }
      };
      initGoogle();
    }
  }, [settingsOpen, isGoogleReady]);

  // 登入後載入雲端資料
  useEffect(() => {
    if (isSignedIn && isGoogleReady) {
      const timer = setTimeout(() => {
        loadFromCloud();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isGoogleReady, loadFromCloud]);

  const handleGoogleLogin = async () => {
    if (!isGoogleReady) return;

    setIsLoggingIn(true);
    try {
      const userInfo = await signIn();
      setUser(userInfo);
    } catch (error) {
      console.error('登入失敗:', error);
      alert('登入失敗，請稍後再試');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = () => {
    signOut();
    setUser(null);
  };

  const handleExportData = () => {
    const data = {
      progress,
      notes,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roadmap-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.progress) useStore.setState({ progress: data.progress });
        if (data.notes) useStore.setState({ notes: data.notes });
        if (data.settings) updateSettings(data.settings);
        alert('資料匯入成功！');
      } catch {
        alert('匯入失敗：檔案格式不正確');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('確定要清除所有資料嗎？')) {
      resetAll();
      setSettingsOpen(false);
    }
  };

  return (
    <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
      <SheetContent side="right" className="w-96 max-w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>設定</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Account */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">帳戶</h3>
            {isSignedIn && user ? (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {user.picture && (
                      <img
                        src={user.picture}
                        alt={user.name}
                        className="w-12 h-12 rounded-full"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleGoogleLogout}
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <p className="text-muted-foreground text-center">尚未登入</p>
                  <p className="text-sm text-muted-foreground text-center">
                    登入後可將資料同步到 Google Drive
                  </p>
                  {googleConfigured ? (
                    <Button
                      onClick={handleGoogleLogin}
                      disabled={!isGoogleReady || isLoggingIn}
                      className="w-full"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      {isLoggingIn ? '登入中...' : isGoogleReady ? '使用 Google 登入' : '載入中...'}
                    </Button>
                  ) : (
                    <p className="text-xs text-destructive text-center">
                      尚未設定 Google API 金鑰
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </section>

          {/* Sync */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">雲端同步</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-secondary rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Cloud className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-foreground">自動同步</p>
                    <p className="text-xs text-muted-foreground">
                      {lastSyncTime ? `上次：${new Date(lastSyncTime).toLocaleString()}` : '尚未同步'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoSync}
                  onCheckedChange={(checked) => updateSettings({ autoSync: checked })}
                />
              </div>

              <Button
                variant="secondary"
                onClick={async () => {
                  if (!isSignedIn) return;

                  try {
                    // 1. 同步 Roadmap 資料
                    await loadFromCloud();

                    // 2. 同步卡片資料
                    const { useCardStore } = await import('@/store/useCardStore');
                    const loaded = await useCardStore.getState().loadFromCloud();

                    if (loaded) {
                      alert('同步成功！已載入雲端資料');
                    } else {
                      alert('同步完成（雲端無新資料）');
                    }
                  } catch (error) {
                    console.error('同步失敗:', error);
                    alert('同步失敗，請稍後再試');
                  }
                }}
                disabled={!isSignedIn || isSyncing}
                className="w-full"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '同步中...' : '立即同步'}
              </Button>
            </div>
          </section>

          {/* Data */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">資料管理</h3>
            <div className="space-y-2">
              <Button
                variant="secondary"
                onClick={handleExportData}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                匯出資料
              </Button>

              <Button variant="secondary" asChild className="w-full">
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  匯入資料
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </Button>

              <Button
                variant="destructive"
                onClick={handleReset}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                清除所有資料
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
