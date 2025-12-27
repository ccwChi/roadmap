import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 播放模式
export const PLAY_MODE = {
  SEQUENCE: 'sequence', // 順序播放
  LOOP: 'loop', // 列表循環
  SINGLE: 'single', // 單曲循環
  SHUFFLE: 'shuffle', // 隨機播放
};

export const useMusicStore = create(
  persist(
    (set, get) => ({
      // ===== 播放狀態 =====
      isPlaying: false,
      currentTrack: null, // { id, name, artist, title, url, duration }
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,
      playMode: PLAY_MODE.SEQUENCE,

      // ===== 播放清單 =====
      playlist: [], // [{ id, name, artist, title, fileId }]
      currentIndex: -1,

      // ===== UI 狀態 =====
      isPlayerOpen: false,
      isPlaylistOpen: false,
      isBrowserOpen: false,
      isLoading: false,
      error: null,

      // ===== 權限狀態 =====
      hasMusicPermission: false,
      setHasMusicPermission: (has) => set({ hasMusicPermission: has }),

      // ===== 播放控制 =====
      setIsPlaying: (playing) => set({ isPlaying: playing }),

      setCurrentTrack: (track) =>
        set({
          currentTrack: track,
          currentTime: 0,
          duration: 0,
        }),

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration: duration }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      setPlayMode: (mode) => set({ playMode: mode }),
      cyclePlayMode: () => {
        const modes = Object.values(PLAY_MODE);
        const currentIndex = modes.indexOf(get().playMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        set({ playMode: modes[nextIndex] });
      },

      // ===== 播放清單操作 =====
      setPlaylist: (tracks) =>
        set({
          playlist: tracks,
          currentIndex: tracks.length > 0 ? 0 : -1,
        }),

      addToPlaylist: (track) =>
        set((state) => ({
          playlist: [...state.playlist, track],
          currentIndex: state.currentIndex === -1 ? 0 : state.currentIndex,
        })),

      addMultipleToPlaylist: (tracks) =>
        set((state) => ({
          playlist: [...state.playlist, ...tracks],
          currentIndex: state.currentIndex === -1 ? 0 : state.currentIndex,
        })),

      removeFromPlaylist: (index) =>
        set((state) => {
          const newPlaylist = [...state.playlist];
          newPlaylist.splice(index, 1);

          let newIndex = state.currentIndex;
          if (index < state.currentIndex) {
            newIndex = state.currentIndex - 1;
          } else if (index === state.currentIndex) {
            newIndex = Math.min(state.currentIndex, newPlaylist.length - 1);
          }

          return {
            playlist: newPlaylist,
            currentIndex: newIndex,
            currentTrack: newIndex >= 0 ? newPlaylist[newIndex] : null,
          };
        }),

      clearPlaylist: () =>
        set({
          playlist: [],
          currentIndex: -1,
          currentTrack: null,
          isPlaying: false,
        }),

      setCurrentIndex: (index) =>
        set((state) => ({
          currentIndex: index,
          currentTrack: state.playlist[index] || null,
        })),

      // 播放指定曲目
      playTrack: (index) => {
        const { playlist } = get();
        if (index >= 0 && index < playlist.length) {
          set({
            currentIndex: index,
            currentTrack: playlist[index],
            isPlaying: true,
          });
        }
      },

      // 下一首
      nextTrack: () => {
        const { playlist, currentIndex, playMode } = get();
        if (playlist.length === 0) return;

        let nextIndex;
        if (playMode === PLAY_MODE.SHUFFLE) {
          nextIndex = Math.floor(Math.random() * playlist.length);
        } else if (playMode === PLAY_MODE.SINGLE) {
          nextIndex = currentIndex;
        } else {
          nextIndex = (currentIndex + 1) % playlist.length;
          if (nextIndex === 0 && playMode === PLAY_MODE.SEQUENCE) {
            set({ isPlaying: false });
            return;
          }
        }

        set({
          currentIndex: nextIndex,
          currentTrack: playlist[nextIndex],
        });
      },

      // 上一首
      prevTrack: () => {
        const { playlist, currentIndex, playMode } = get();
        if (playlist.length === 0) return;

        let prevIndex;
        if (playMode === PLAY_MODE.SHUFFLE) {
          prevIndex = Math.floor(Math.random() * playlist.length);
        } else {
          prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
        }

        set({
          currentIndex: prevIndex,
          currentTrack: playlist[prevIndex],
        });
      },

      // ===== UI 控制 =====
      setPlayerOpen: (open) => set({ isPlayerOpen: open }),
      setPlaylistOpen: (open) => set({ isPlaylistOpen: open }),
      setBrowserOpen: (open) => set({ isBrowserOpen: open }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error: error }),
    }),
    {
      name: 'music-player-storage',
      partialize: (state) => ({
        // 只持久化這些狀態
        playlist: state.playlist,
        volume: state.volume,
        playMode: state.playMode,
        hasMusicPermission: state.hasMusicPermission,
      }),
    }
  )
);
