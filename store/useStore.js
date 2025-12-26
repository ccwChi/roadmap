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
            const { isSignedIn, progress, notes, settings, isOffline } = get();
            if (!isSignedIn) return;

            const syncData = {
              progress,
              notes,
              settings,
              updatedAt: new Date().toISOString(),
            };

            // 離線時，將資料加入 Background Sync 佇列
            if (isOffline || !navigator.onLine) {
              try {
                const { queueSync, getPendingCount } = await import('@/lib/offlineSync');
                await queueSync(syncData);
                const count = await getPendingCount();
                set({ pendingSyncCount: count, syncError: '離線中，將在恢復連線後同步' });
              } catch (error) {
                console.error('加入離線佇列失敗:', error);
              }
              return;
            }

            set({ isSyncing: true, syncError: null });
            try {
              const { saveData } = await import('@/lib/googleDrive');
              await saveData(syncData);
              set({ lastSyncTime: new Date().toISOString(), syncError: null, pendingSyncCount: 0 });
            } catch (error) {
              console.error('同步失敗:', error);
              // 同步失敗時，嘗試加入離線佇列
              try {
                const { queueSync, getPendingCount } = await import('@/lib/offlineSync');
                await queueSync(syncData);
                const count = await getPendingCount();
                set({ pendingSyncCount: count, syncError: '同步失敗，已加入離線佇列' });
              } catch (queueError) {
                set({ syncError: error.message || '同步失敗，請稍後再試' });
              }
            } finally {
              set({ isSyncing: false });
            }
          }, 500);
        };
      })(),

      // 處理離線佇列同步請求
      handleOfflineSync: async (data) => {
        const { isSignedIn } = get();
        if (!isSignedIn || !navigator.onLine) return;

        set({ isSyncing: true, syncError: null });
        try {
          const { saveData } = await import('@/lib/googleDrive');
          await saveData(data);
          set({
            lastSyncTime: new Date().toISOString(),
            syncError: null,
            pendingSyncCount: 0,
          });
        } catch (error) {
          console.error('離線同步失敗:', error);
          set({ syncError: error.message || '離線同步失敗' });
        } finally {
          set({ isSyncing: false });
        }
      },

      // 從雲端載入
      loadFromCloud: async () => {
        const { isSignedIn } = get();
        if (!isSignedIn) return;

        set({ isSyncing: true });
        try {
          const { loadData } = await import('@/lib/googleDrive');
          const cloudData = await loadData();

          set({
            progress: cloudData.progress || {},
            notes: cloudData.notes || {},
            settings: { ...get().settings, ...cloudData.settings },
            lastSyncTime: cloudData.updatedAt,
          });
        } catch (error) {
          console.error('載入雲端資料失敗:', error);
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
      // 序列化時將 Set 轉為 Array
      serialize: (state) => JSON.stringify(state),
      deserialize: (str) => JSON.parse(str),
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