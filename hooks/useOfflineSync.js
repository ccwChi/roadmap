'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

// 離線同步 Hook
export function useOfflineSync() {
  const {
    isSignedIn,
    setOfflineStatus,
    setPendingSyncCount,
    handleOfflineSync,
    syncToCloud,
  } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 設定初始網路狀態
    setOfflineStatus(!navigator.onLine);

    // 監聽網路狀態變化
    const handleOnline = async () => {
      setOfflineStatus(false);

      // 恢復連線時，嘗試同步待處理的資料
      if (isSignedIn) {
        try {
          const { forceSync, getPendingCount } = await import('@/lib/offlineSync');
          await forceSync();
          const count = await getPendingCount();
          setPendingSyncCount(count);
        } catch (error) {
          console.error('恢復連線同步失敗:', error);
        }
      }
    };

    const handleOffline = () => {
      setOfflineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 監聽 Service Worker 訊息
    const handleSWMessage = async (event) => {
      if (event.data?.type === 'SYNC_REQUIRED') {
        await handleOfflineSync(event.data.payload);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    // 初始化時檢查待同步數量
    const checkPending = async () => {
      try {
        const { getPendingCount } = await import('@/lib/offlineSync');
        const count = await getPendingCount();
        setPendingSyncCount(count);
      } catch (error) {
        // 忽略錯誤（可能是 SW 尚未就緒）
      }
    };
    checkPending();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [isSignedIn, setOfflineStatus, setPendingSyncCount, handleOfflineSync]);

  // 當頁面關閉前，確保資料已同步
  useEffect(() => {
    const handleBeforeUnload = () => {
      // 觸發立即同步（不使用防抖動）
      syncToCloud();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [syncToCloud]);
}
