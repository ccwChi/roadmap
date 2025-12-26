// 離線同步管理器
// 用於與 Service Worker 通訊，處理離線時的資料同步

// 檢查是否支援 Background Sync
export const isBackgroundSyncSupported = () => {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
};

// 檢查是否在線
export const isOnline = () => {
  return navigator.onLine;
};

// 發送訊息給 Service Worker
const sendMessageToSW = (message) => {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker?.controller) {
      reject(new Error('Service Worker 未就緒'));
      return;
    }

    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);

    // 5秒超時
    setTimeout(() => {
      reject(new Error('Service Worker 回應超時'));
    }, 5000);
  });
};

// 將資料加入離線同步佇列
export const queueSync = async (data) => {
  if (!isBackgroundSyncSupported()) {
    console.warn('[OfflineSync] Background Sync 不支援');
    return false;
  }

  try {
    const result = await sendMessageToSW({
      type: 'QUEUE_SYNC',
      payload: { data },
    });
    return result.success;
  } catch (error) {
    console.error('[OfflineSync] 加入佇列失敗:', error);
    return false;
  }
};

// 取得待同步數量
export const getPendingCount = async () => {
  if (!isBackgroundSyncSupported()) {
    return 0;
  }

  try {
    const result = await sendMessageToSW({ type: 'GET_PENDING_COUNT' });
    return result.count || 0;
  } catch (error) {
    console.error('[OfflineSync] 取得待同步數量失敗:', error);
    return 0;
  }
};

// 強制同步
export const forceSync = async () => {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const result = await sendMessageToSW({ type: 'FORCE_SYNC' });
    return result.success;
  } catch (error) {
    console.error('[OfflineSync] 強制同步失敗:', error);
    return false;
  }
};

// 清空待同步佇列
export const clearPending = async () => {
  if (!isBackgroundSyncSupported()) {
    return false;
  }

  try {
    const result = await sendMessageToSW({ type: 'CLEAR_PENDING' });
    return result.success;
  } catch (error) {
    console.error('[OfflineSync] 清空佇列失敗:', error);
    return false;
  }
};

// 監聽 Service Worker 訊息
export const listenForSyncMessages = (callback) => {
  if (!('serviceWorker' in navigator)) {
    return () => {};
  }

  const handler = (event) => {
    if (event.data?.type === 'SYNC_REQUIRED') {
      callback(event.data.payload);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handler);
  };
};

// 監聽網路狀態變化
export const listenForNetworkChanges = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// 網路狀態 Hook 初始化
export const initNetworkStatus = () => {
  if (typeof window === 'undefined') {
    return { isOnline: true, cleanup: () => {} };
  }

  let currentStatus = navigator.onLine;
  const listeners = new Set();

  const notify = (status) => {
    currentStatus = status;
    listeners.forEach((listener) => listener(status));
  };

  const handleOnline = () => notify(true);
  const handleOffline = () => notify(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return {
    isOnline: () => currentStatus,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    cleanup: () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    },
  };
};
