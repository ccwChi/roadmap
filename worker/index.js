// 自定義 Service Worker - Background Sync 支援
// 這個檔案會被 @ducanh2912/next-pwa 合併到主 service worker

const SYNC_TAG = 'roadmap-sync';
const SYNC_STORE_NAME = 'pending-syncs';
const DB_NAME = 'roadmap-offline-db';
const DB_VERSION = 1;

// IndexedDB 操作
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// 儲存待同步資料
const savePendingSync = async (data) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.add({
      ...data,
      timestamp: Date.now(),
    });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 取得所有待同步資料
const getPendingSyncs = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readonly');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 刪除已同步資料
const deletePendingSync = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 清空所有待同步資料
const clearPendingSyncs = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_STORE_NAME, 'readwrite');
    const store = tx.objectStore(SYNC_STORE_NAME);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 處理來自主線程的訊息
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'QUEUE_SYNC':
      // 將資料加入待同步佇列
      try {
        await savePendingSync(payload);
        // 註冊 Background Sync
        if ('sync' in self.registration) {
          await self.registration.sync.register(SYNC_TAG);
        }
        event.ports[0]?.postMessage({ success: true });
      } catch (error) {
        console.error('[SW] 儲存待同步資料失敗:', error);
        event.ports[0]?.postMessage({ success: false, error: error.message });
      }
      break;

    case 'GET_PENDING_COUNT':
      // 取得待同步數量
      try {
        const pending = await getPendingSyncs();
        event.ports[0]?.postMessage({ count: pending.length });
      } catch (error) {
        event.ports[0]?.postMessage({ count: 0 });
      }
      break;

    case 'GET_PENDING_DATA':
      // 取得所有待同步資料
      try {
        const pendingData = await getPendingSyncs();
        event.ports[0]?.postMessage({ data: pendingData });
      } catch (error) {
        event.ports[0]?.postMessage({ data: [] });
      }
      break;

    case 'FORCE_SYNC':
      // 強制執行同步
      try {
        await performSync();
        event.ports[0]?.postMessage({ success: true });
      } catch (error) {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      }
      break;

    case 'CLEAR_PENDING':
      // 清空待同步佇列
      try {
        await clearPendingSyncs();
        event.ports[0]?.postMessage({ success: true });
      } catch (error) {
        event.ports[0]?.postMessage({ success: false, error: error.message });
      }
      break;
  }
});

// Background Sync 事件處理
self.addEventListener('sync', async (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(performSync());
  }
});

// 執行同步
const performSync = async () => {
  const pendingSyncs = await getPendingSyncs();

  if (pendingSyncs.length === 0) {
    return;
  }

  // 取得最新的資料（合併所有待同步資料）
  const latestSync = pendingSyncs.reduce((latest, current) => {
    return current.timestamp > latest.timestamp ? current : latest;
  });

  // 通知主線程執行同步
  const clients = await self.clients.matchAll({ type: 'window' });

  for (const client of clients) {
    client.postMessage({
      type: 'SYNC_REQUIRED',
      payload: latestSync.data,
    });
  }

  // 清空佇列（讓主線程處理實際的 API 呼叫）
  await clearPendingSyncs();
};

// 網路狀態變化
self.addEventListener('online', async () => {
  // 網路恢復時嘗試同步
  if ('sync' in self.registration) {
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch (error) {
      console.error('[SW] 註冊同步失敗:', error);
    }
  }
});

// 推送通知（可選，用於同步完成通知）
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  if (data.type === 'SYNC_COMPLETE') {
    event.waitUntil(
      self.registration.showNotification('AI Roadmap', {
        body: '資料已同步完成',
        icon: '/icons/icon-192x192.svg',
        badge: '/icons/icon-192x192.svg',
        tag: 'sync-notification',
      })
    );
  }
});

console.log('[SW] 自定義 Service Worker 已載入 - Background Sync 支援');
