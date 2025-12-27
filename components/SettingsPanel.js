'use client';

import { useState, useEffect } from 'react';
import { X, Trash2, Download, Upload, Cloud, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { useStore, useUIStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

  // 登入後載入雲端資料（延遲一下確保 token 設定完成）
  useEffect(() => {
    if (isSignedIn && isGoogleReady) {
      // 延遲 500ms 確保 token 已經設定到 gapi.client
      const timer = setTimeout(() => {
        loadFromCloud();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn, isGoogleReady, loadFromCloud]);

  if (!settingsOpen) return null;

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
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={() => setSettingsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-card border-l border-border z-50 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">設定</h2>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-6">
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
                      尚未設定 Google API 金鑰，請參考下方說明
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
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSync}
                    onChange={(e) => updateSettings({ autoSync: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-foreground after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <button
                onClick={() => isSignedIn && loadFromCloud()}
                disabled={!isSignedIn || isSyncing}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-foreground rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '同步中...' : '立即同步'}
              </button>
            </div>
          </section>

          {/* Data */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">資料管理</h3>
            <div className="space-y-2">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                匯出資料
              </button>

              <label className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors cursor-pointer">
                <Upload className="w-4 h-4" />
                匯入資料
                <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
              </label>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                清除所有資料
              </button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
