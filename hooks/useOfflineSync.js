'use client';

import { useEffect, useCallback, useRef } from 'react';
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

  // 使用 ref 來追蹤是否正在同步，避免重複觸發
  const isSyncingRef = useRef(false);

  // 嘗試同步本地存儲的資料
  const syncPendingData = useCallback(async () => {
    if (isSyncingRef.current || !isSignedIn) return;

    isSyncingRef.current = true;
    try {
      const { getPendingData, clearPending, getPendingCount } = await import('@/lib/offlineSync');
      const pendingItems = await getPendingData();

      if (pendingItems.length > 0) {
        // 取得最新的資料進行同步
        const latestData = pendingItems[0].data;
        await handleOfflineSync(latestData);
      }

      const count = await getPendingCount();
      setPendingSyncCount(count);
    } catch (error) {
      console.warn('[useOfflineSync] 同步待處理資料失敗:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isSignedIn, handleOfflineSync, setPendingSyncCount]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 設定初始網路狀態
    setOfflineStatus(!navigator.onLine);

    // 監聽網路狀態變化
    const handleOnline = async () => {
      console.log('[useOfflineSync] 網路恢復');
      setOfflineStatus(false);

      // 恢復連線時，嘗試同步待處理的資料
      if (isSignedIn) {
        // 給一點延遲讓網路穩定
        setTimeout(async () => {
          try {
            const { forceSync, getPendingCount } = await import('@/lib/offlineSync');
            await forceSync();

            // 也嘗試同步本地存儲的資料
            await syncPendingData();

            const count = await getPendingCount();
            setPendingSyncCount(count);
          } catch (error) {
            console.warn('[useOfflineSync] 恢復連線同步失敗:', error);
          }
        }, 1000);
      }
    };

    const handleOffline = () => {
      console.log('[useOfflineSync] 網路斷開');
      setOfflineStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 監聽 Service Worker 訊息
    const handleSWMessage = async (event) => {
      if (event.data?.type === 'SYNC_REQUIRED') {
        console.log('[useOfflineSync] 收到 SW 同步請求');
        await handleOfflineSync(event.data.payload);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);

      // 監聽 Service Worker 狀態變化
      navigator.serviceWorker.ready.then((registration) => {
        console.log('[useOfflineSync] Service Worker 已就緒');
        // SW 就緒後檢查待同步數量
        checkPendingCount();
      }).catch((error) => {
        console.warn('[useOfflineSync] Service Worker 未就緒:', error);
      });
    }

    // 檢查待同步數量的函數
    const checkPendingCount = async () => {
      try {
        const { getPendingCount } = await import('@/lib/offlineSync');
        const count = await getPendingCount();
        setPendingSyncCount(count);

        // 如果有待同步資料且在線，嘗試同步
        if (count > 0 && navigator.onLine && isSignedIn) {
          await syncPendingData();
        }
      } catch (error) {
        // 忽略錯誤（可能是 SW 尚未就緒）
        console.warn('[useOfflineSync] 檢查待同步數量失敗:', error);
      }
    };

    // 初始化時檢查
    checkPendingCount();

    // 定期檢查待同步資料（每 30 秒）
    const intervalId = setInterval(() => {
      if (navigator.onLine && isSignedIn) {
        checkPendingCount();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [isSignedIn, setOfflineStatus, setPendingSyncCount, handleOfflineSync, syncPendingData]);

  // 當頁面可見性改變時檢查同步狀態
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && navigator.onLine && isSignedIn) {
        // 頁面變為可見時，檢查是否有待同步資料
        try {
          const { getPendingCount } = await import('@/lib/offlineSync');
          const count = await getPendingCount();
          setPendingSyncCount(count);

          if (count > 0) {
            await syncPendingData();
          }
        } catch (error) {
          // 忽略錯誤
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn, setPendingSyncCount, syncPendingData]);

  // 當頁面關閉前，確保資料已同步
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
