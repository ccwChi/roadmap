import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主要狀態管理
export const useStore = create(
  persist(
    (set, get) => ({
      // ===== 用戶狀態 =====
      user: null,
      isSignedIn: false,
      setUser: (user) => set({ user, isSignedIn: !!user }),

      // ===== 當前 Roadmap =====
      currentRoadmapId: 'ai-agents',
      setCurrentRoadmap: (id) => set({ currentRoadmapId: id }),

      // ===== 進度追蹤 =====
      // 結構: { roadmapId: Set<nodeId> }
      progress: {},

      toggleNodeComplete: (roadmapId, nodeId) => {
        const { progress, syncToCloud } = get();
        const roadmapProgress = new Set(progress[roadmapId] || []);

        if (roadmapProgress.has(nodeId)) {
          roadmapProgress.delete(nodeId);
        } else {
          roadmapProgress.add(nodeId);
        }

        const newProgress = {
          ...progress,
          [roadmapId]: Array.from(roadmapProgress),
        };

        set({ progress: newProgress });
        syncToCloud();
      },

      isNodeCompleted: (roadmapId, nodeId) => {
        const { progress } = get();
        const roadmapProgress = progress[roadmapId] || [];
        return roadmapProgress.includes(nodeId);
      },

      getProgress: (roadmapId, totalNodes) => {
        const { progress } = get();
        const completed = (progress[roadmapId] || []).length;
        return {
          completed,
          total: totalNodes,
          percentage: totalNodes > 0 ? Math.round((completed / totalNodes) * 100) : 0,
        };
      },

      // ===== 筆記功能 =====
      // 結構: { roadmapId: { nodeId: "note content" } }
      notes: {},

      setNote: (roadmapId, nodeId, content) => {
        const { notes, syncToCloud } = get();
        const roadmapNotes = notes[roadmapId] || {};

        const newNotes = {
          ...notes,
          [roadmapId]: {
            ...roadmapNotes,
            [nodeId]: content,
          },
        };

        set({ notes: newNotes });
        syncToCloud();
      },

      getNote: (roadmapId, nodeId) => {
        const { notes } = get();
        return notes[roadmapId]?.[nodeId] || '';
      },

      deleteNote: (roadmapId, nodeId) => {
        const { notes, syncToCloud } = get();
        const roadmapNotes = { ...notes[roadmapId] };
        delete roadmapNotes[nodeId];

        set({
          notes: {
            ...notes,
            [roadmapId]: roadmapNotes,
          },
        });
        syncToCloud();
      },

      // ===== 設定 =====
      settings: {
        theme: 'dark',
        autoSync: true,
      },

      updateSettings: (newSettings) => {
        const { settings, syncToCloud } = get();
        set({ settings: { ...settings, ...newSettings } });
        syncToCloud();
      },

      // ===== 雲端同步 =====
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,
      isOffline: false,
      pendingSyncCount: 0,

      // 設定網路狀態
      setOfflineStatus: (isOffline) => set({ isOffline }),
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),

      // 同步到雲端 (防抖動 + 離線支援)
      syncToCloud: (() => {
        let timeout = null;
        return () => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(async () => {
            console.log('[Sync] === 開始同步流程 ===');
            const { isSignedIn, progress, notes, settings, isOffline } = get();
            console.log('[Sync] 1. 登入狀態:', isSignedIn);
            if (!isSignedIn) {
              console.log('[Sync] ❌ 未登入，跳過同步');
              return;
            }

            const syncData = {
              progress,
              notes,
              settings,
              updatedAt: new Date().toISOString(),
            };

            // 檢查是否真的在線
            const isReallyOnline = typeof navigator !== 'undefined' && navigator.onLine;
            console.log('[Sync] 2. 網路狀態:', { isOffline, isReallyOnline });

            // 離線時，將資料加入 Background Sync 佇列
            if (isOffline || !isReallyOnline) {
              try {
                const { queueSync, getPendingCount } = await import('@/lib/offlineSync');
                const queued = await queueSync(syncData);
                if (queued) {
                  const count = await getPendingCount();
                  set({ pendingSyncCount: count, syncError: null });
                }
              } catch (error) {
                console.warn('加入離線佇列失敗:', error);
              }
              return;
            }

            set({ isSyncing: true, syncError: null });
            console.log('[Sync] 3. 設定 isSyncing = true');

            // 超時保護：10 秒後強制重置 isSyncing
            const timeoutId = setTimeout(() => {
              console.warn('[Sync] 同步超時，強制重置狀態');
              set({ isSyncing: false, syncError: '同步超時' });
            }, 10000);

            try {
              const { saveData, isGoogleConfigured, waitForGoogleApiReady } = await import('@/lib/googleDrive');

              // 檢查 Google API 是否已配置
              const configured = isGoogleConfigured();
              console.log('[Sync] 4. Google API 配置:', configured);
              if (!configured) {
                console.warn('[Sync] Google API 未配置，跳過雲端同步');
                clearTimeout(timeoutId);
                set({ isSyncing: false });
                return;
              }

              // 等待 Google API 就緒（最多等 5 秒）
              console.log('[Sync] 5. 等待 Google API 就緒（5秒）...');
              try {
                await waitForGoogleApiReady(5000);
                console.log('[Sync] ✅ Google API 已就緒');
              } catch {
                console.warn('[Sync] Google API 未就緒，將資料加入離線佇列');
                const { queueSync, getPendingCount } = await import('@/lib/offlineSync');
                await queueSync(syncData);
                const count = await getPendingCount();
                clearTimeout(timeoutId);
                set({ pendingSyncCount: count, syncError: null, isSyncing: false });
                return;
              }

              console.log('[Sync] 6. 開始儲存到 Google Drive...');
              await saveData(syncData);
              console.log('[Sync] ✅ 儲存成功');
              clearTimeout(timeoutId);
              set({
                lastSyncTime: new Date().toISOString(),
                syncError: null,
                pendingSyncCount: 0,
                isSyncing: false, // ✅ 立即重置，不要等 clearPending
              });

              // 成功後清空離線佇列（背景執行，不阻塞）
              console.log('[Sync] 7. 清空離線佇列（背景執行）...');
              import('@/lib/offlineSync').then(({ clearPending }) => {
                clearPending().then(() => {
                  console.log('[Sync] ✅ 離線佇列已清空');
                }).catch((error) => {
                  console.log('[Sync] ⚠️ 清空離線佇列失敗:', error.message);
                });
              });
            } catch (error) {
              console.error('同步失敗:', error);
              clearTimeout(timeoutId);
              // 同步失敗時，嘗試加入離線佇列
              try {
                const { queueSync, getPendingCount } = await import('@/lib/offlineSync');
                const queued = await queueSync(syncData);
                if (queued) {
                  const count = await getPendingCount();
                  set({ pendingSyncCount: count, syncError: null });
                } else {
                  set({ syncError: error.message || '同步失敗，請稍後再試' });
                }
              } catch (queueError) {
                set({ syncError: error.message || '同步失敗，請稍後再試' });
              }
            } finally {
              set({ isSyncing: false });
              console.log('[Sync] === 同步流程結束 ===\n');
            }
          }, 500);
        };
      })(),

      // 處理離線佇列同步請求
      handleOfflineSync: async (data) => {
        const { isSignedIn } = get();
        const isReallyOnline = typeof navigator !== 'undefined' && navigator.onLine;

        if (!isSignedIn || !isReallyOnline) return;

        set({ isSyncing: true, syncError: null });
        try {
          const { saveData, isGoogleConfigured, waitForGoogleApiReady } = await import('@/lib/googleDrive');

          // 檢查 Google API 是否已配置
          if (!isGoogleConfigured()) {
            console.warn('[OfflineSync] Google API 未配置，保持資料在佇列中');
            set({ isSyncing: false });
            return;
          }

          // 等待 Google API 就緒（最多等 5 秒）
          try {
            await waitForGoogleApiReady(5000);
          } catch {
            console.warn('[OfflineSync] Google API 未就緒，保持資料在佇列中');
            set({ isSyncing: false });
            return;
          }

          // 如果傳入的 data 是有效的，使用它；否則嘗試從佇列取得
          let syncData = data;
          if (!syncData) {
            const { getPendingData } = await import('@/lib/offlineSync');
            const pendingItems = await getPendingData();
            if (pendingItems.length > 0) {
              // 使用最新的資料
              syncData = pendingItems[0].data;
            }
          }

          if (!syncData) {
            set({ isSyncing: false, pendingSyncCount: 0 });
            return;
          }

          await saveData(syncData);

          // 同步成功，清空佇列
          const { clearPending, getPendingCount } = await import('@/lib/offlineSync');
          await clearPending();
          const count = await getPendingCount();

          set({
            lastSyncTime: new Date().toISOString(),
            syncError: null,
            pendingSyncCount: count,
          });
        } catch (error) {
          console.error('離線同步失敗:', error);
          // 不設置 syncError，因為資料仍在佇列中
          const { getPendingCount } = await import('@/lib/offlineSync');
          const count = await getPendingCount();
          set({ pendingSyncCount: count });
        } finally {
          set({ isSyncing: false });
        }
      },

      // 從雲端載入
      loadFromCloud: async () => {
        const { isSignedIn } = get();
        if (!isSignedIn) return { success: false, reason: '未登入' };

        // 檢查是否在線
        const isReallyOnline = typeof navigator !== 'undefined' && navigator.onLine;
        if (!isReallyOnline) {
          console.warn('[LoadFromCloud] 離線狀態，跳過載入');
          return { success: false, reason: '離線狀態' };
        }

        set({ isSyncing: true, syncError: null });
        try {
          const { loadData, isGoogleConfigured, waitForGoogleApiReady } = await import('@/lib/googleDrive');

          // 檢查 Google API 是否已配置
          if (!isGoogleConfigured()) {
            console.warn('[LoadFromCloud] Google API 未配置');
            set({ isSyncing: false });
            return { success: false, reason: 'Google API 未配置' };
          }

          // 等待 Google API 就緒（最多等 10 秒）
          try {
            await waitForGoogleApiReady(10000);
          } catch {
            console.warn('[LoadFromCloud] Google API 未就緒');
            set({ isSyncing: false, syncError: 'Google API 尚未就緒，請稍後再試' });
            return { success: false, reason: 'Google API 未就緒' };
          }

          const cloudData = await loadData();

          // 檢查雲端資料是否有效
          if (cloudData && (cloudData.progress || cloudData.notes)) {
            set({
              progress: cloudData.progress || {},
              notes: cloudData.notes || {},
              settings: { ...get().settings, ...cloudData.settings },
              lastSyncTime: cloudData.updatedAt || new Date().toISOString(),
              syncError: null,
            });
            return { success: true };
          } else {
            // 雲端沒有資料，這不是錯誤，可能是新用戶
            console.log('[LoadFromCloud] 雲端無資料，使用本地資料');
            set({ lastSyncTime: new Date().toISOString() });
            return { success: true, isNewUser: true };
          }
        } catch (error) {
          console.error('載入雲端資料失敗:', error);
          // 不顯示錯誤給用戶，因為可能只是暫時性問題
          return { success: false, reason: error.message };
        } finally {
          set({ isSyncing: false });
        }
      },

      // 重置所有資料
      resetAll: () => {
        set({
          progress: {},
          notes: {},
          settings: { theme: 'dark', autoSync: true },
        });
      },
    }),
    {
      name: 'roadmap-storage',
      // 只持久化部分狀態，排除 session 相關 (user, isSignedIn)
      partialize: (state) => ({
        currentRoadmapId: state.currentRoadmapId,
        progress: state.progress,
        notes: state.notes,
        // 恢復使用者狀態持久化，配合 LocalStorage Token 機制
        isSignedIn: state.isSignedIn,
        user: state.user,
      }),
      // 序列化是部分狀態，不需要自定義 serialize (除非 Set/Map 需要)
      // 但上面原本有用 serialize/deserialize 處理 Set ? 不，progress 內部是 Array (line 33)
      // 讓我們保持簡單，如果 progress 是物件+陣列，JSON.stringify 是默認行為
    }
  )
);

// UI 狀態 (不需要持久化)
export const useUIStore = create((set) => ({
  // 側邊欄
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // 選中的節點
  selectedNode: null,
  setSelectedNode: (node) => set({ selectedNode: node }),

  // 搜尋
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // 設定面板
  settingsOpen: false,
  setSettingsOpen: (open) => set({ settingsOpen: open }),

  // 筆記編輯模式
  isEditingNote: false,
  setIsEditingNote: (editing) => set({ isEditingNote: editing }),
}));