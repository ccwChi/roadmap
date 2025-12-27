// 離線同步管理器
// 用於與 Service Worker 通訊，處理離線時的資料同步

// 檢查是否支援 Background Sync
export const isBackgroundSyncSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'SyncManager' in window;
};

// 檢查是否支援 Service Worker（即使沒有 Background Sync）
export const isServiceWorkerSupported = () => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator;
};

// 檢查是否在線
export const isOnline = () => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

// 等待 Service Worker 就緒
const waitForServiceWorker = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (!isServiceWorkerSupported()) {
      reject(new Error('瀏覽器不支援 Service Worker'));
      return;
    }

    // 如果已經有 controller，直接返回
    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.controller);
      return;
    }

    // 設置超時
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('等待 Service Worker 超時'));
    }, timeout);

    // 監聽 controller 變化
    const handleControllerChange = () => {
      if (navigator.serviceWorker.controller) {
        cleanup();
        resolve(navigator.serviceWorker.controller);
      }
    };

    // 清理函數
    const cleanup = () => {
      clearTimeout(timeoutId);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // 也嘗試等待 ready 狀態
    navigator.serviceWorker.ready.then(() => {
      // ready 後再檢查一次 controller
      if (navigator.serviceWorker.controller) {
        cleanup();
        resolve(navigator.serviceWorker.controller);
      }
    }).catch(() => {
      // 忽略 ready 錯誤，讓超時處理
    });
  });
};

// 發送訊息給 Service Worker（帶有自動等待和重試機制）
const sendMessageToSW = async (message, options = {}) => {
  const { timeout = 5000, retries = 2 } = options;

  // 確保 Service Worker 支援
  if (!isServiceWorkerSupported()) {
    console.warn('[OfflineSync] 瀏覽器不支援 Service Worker，使用本地存儲降級');
    return { success: false, fallback: true };
  }

  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 等待 Service Worker 就緒
      let controller = navigator.serviceWorker.controller;
      if (!controller) {
        try {
          controller = await waitForServiceWorker(3000);
        } catch {
          // 如果等待失敗，嘗試使用 ready 狀態的 active worker
          const registration = await navigator.serviceWorker.ready;
          controller = registration.active;
        }
      }

      if (!controller) {
        throw new Error('無法取得 Service Worker controller');
      }

      // 發送訊息
      return await new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();
        let resolved = false;

        messageChannel.port1.onmessage = (event) => {
          if (!resolved) {
            resolved = true;
            resolve(event.data);
          }
        };

        messageChannel.port1.onerror = (error) => {
          if (!resolved) {
            resolved = true;
            reject(error);
          }
        };

        controller.postMessage(message, [messageChannel.port2]);

        // 超時處理
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Service Worker 回應超時'));
          }
        }, timeout);
      });
    } catch (error) {
      lastError = error;
      console.warn(`[OfflineSync] 第 ${attempt + 1} 次嘗試失敗:`, error.message);

      // 如果還有重試機會，等待一下再試
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
    }
  }

  // 所有重試都失敗，返回降級結果
  console.warn('[OfflineSync] 所有嘗試都失敗，使用降級模式:', lastError?.message);
  return { success: false, fallback: true, error: lastError?.message };
};

// 本地存儲降級方案（當 Service Worker 不可用時）
const LOCAL_STORAGE_KEY = 'roadmap-pending-sync';

const saveToLocalStorage = (data) => {
  try {
    const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
    existing.push({ data, timestamp: Date.now() });
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (error) {
    console.error('[OfflineSync] 本地存儲失敗:', error);
    return false;
  }
};

const getFromLocalStorage = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const clearLocalStorage = () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};

// 將資料加入離線同步佇列
export const queueSync = async (data) => {
  // 即使不支援 Background Sync，也嘗試使用 Service Worker 或本地存儲
  if (!isServiceWorkerSupported()) {
    console.warn('[OfflineSync] Service Worker 不支援，使用本地存儲');
    return saveToLocalStorage(data);
  }

  try {
    const result = await sendMessageToSW({
      type: 'QUEUE_SYNC',
      payload: { data },
    });

    // 如果 Service Worker 回應了降級標記，使用本地存儲
    if (result.fallback) {
      console.warn('[OfflineSync] Service Worker 不可用，降級到本地存儲');
      return saveToLocalStorage(data);
    }

    return result.success !== false;
  } catch (error) {
    console.error('[OfflineSync] 加入佇列失敗，嘗試本地存儲:', error);
    return saveToLocalStorage(data);
  }
};

// 取得待同步數量
export const getPendingCount = async () => {
  let swCount = 0;
  let localCount = 0;

  // 嘗試從 Service Worker 取得
  if (isServiceWorkerSupported()) {
    try {
      const result = await sendMessageToSW({ type: 'GET_PENDING_COUNT' });
      if (!result.fallback) {
        swCount = result.count || 0;
      }
    } catch (error) {
      console.warn('[OfflineSync] 從 Service Worker 取得數量失敗:', error);
    }
  }

  // 加上本地存儲的數量
  localCount = getFromLocalStorage().length;

  return swCount + localCount;
};

// 取得所有待同步資料（包含本地存儲）
export const getPendingData = async () => {
  const allData = [];

  // 從 Service Worker 取得
  if (isServiceWorkerSupported()) {
    try {
      const result = await sendMessageToSW({ type: 'GET_PENDING_DATA' });
      if (!result.fallback && result.data) {
        allData.push(...result.data);
      }
    } catch (error) {
      console.warn('[OfflineSync] 從 Service Worker 取得資料失敗:', error);
    }
  }

  // 從本地存儲取得
  const localData = getFromLocalStorage();
  allData.push(...localData);

  // 按時間戳排序，返回最新的
  return allData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

// 強制同步
export const forceSync = async () => {
  let success = false;

  // 嘗試透過 Service Worker 同步
  if (isServiceWorkerSupported()) {
    try {
      const result = await sendMessageToSW({ type: 'FORCE_SYNC' });
      if (!result.fallback) {
        success = result.success !== false;
      }
    } catch (error) {
      console.warn('[OfflineSync] Service Worker 強制同步失敗:', error);
    }
  }

  // 返回成功狀態（本地存儲的資料會由呼叫者處理）
  return success || getFromLocalStorage().length > 0;
};

// 清空待同步佇列
export const clearPending = async () => {
  let swSuccess = true;
  let localSuccess = true;

  // 清空 Service Worker 佇列
  if (isServiceWorkerSupported()) {
    try {
      const result = await sendMessageToSW({ type: 'CLEAR_PENDING' });
      if (!result.fallback) {
        swSuccess = result.success !== false;
      }
    } catch (error) {
      console.warn('[OfflineSync] 清空 Service Worker 佇列失敗:', error);
      swSuccess = false;
    }
  }

  // 清空本地存儲
  localSuccess = clearLocalStorage();

  return swSuccess && localSuccess;
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
