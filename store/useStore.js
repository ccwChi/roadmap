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

      // 同步到雲端 (防抖動)
      syncToCloud: (() => {
        let timeout = null;
        return () => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(async () => {
            const { isSignedIn, progress, notes, settings } = get();
            if (!isSignedIn) return;

            set({ isSyncing: true });
            try {
              const { saveData } = await import('@/lib/googleDrive');
              await saveData({
                progress,
                notes,
                settings,
                updatedAt: new Date().toISOString(),
              });
              set({ lastSyncTime: new Date().toISOString() });
            } catch (error) {
              console.error('同步失敗:', error);
            } finally {
              set({ isSyncing: false });
            }
          }, 2000); // 2秒防抖動
        };
      })(),

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
