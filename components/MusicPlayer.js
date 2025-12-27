'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Music,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  List,
  Repeat,
  Repeat1,
  Shuffle,
  FolderOpen,
  Search,
  Loader2,
  ChevronRight,
  Trash2,
  Plus,
  AlertCircle,
} from 'lucide-react';
import { useMusicStore, PLAY_MODE } from '@/store/useMusicStore';
import { useStore } from '@/store/useStore';

export default function MusicPlayer() {
  const { isSignedIn } = useStore();
  const {
    isPlaying,
    setIsPlaying,
    currentTrack,
    setCurrentTrack,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    playMode,
    cyclePlayMode,
    playlist,
    currentIndex,
    addToPlaylist,
    addMultipleToPlaylist,
    removeFromPlaylist,
    clearPlaylist,
    playTrack,
    nextTrack,
    prevTrack,
    isPlayerOpen,
    setPlayerOpen,
    isPlaylistOpen,
    setPlaylistOpen,
    isBrowserOpen,
    setBrowserOpen,
    isLoading,
    setLoading,
    error,
    setError,
    hasMusicPermission,
    setHasMusicPermission,
  } = useMusicStore();

  const audioRef = useRef(null);
  const [musicFiles, setMusicFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 初始化 Audio 元素
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('durationchange', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      nextTrack();
    });

    audio.addEventListener('error', (e) => {
      console.error('[Music] 播放錯誤:', e);
      setError('播放失敗，請重試');
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // 更新音量
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 當前曲目改變時載入
  useEffect(() => {
    const loadAndPlay = async () => {
      if (!currentTrack?.fileId || !audioRef.current) return;

      setLoading(true);
      setError(null);

      try {
        const { getMusicStreamUrl } = await import('@/lib/googleDriveMusic');
        const url = await getMusicStreamUrl(currentTrack.fileId);

        audioRef.current.src = url;
        audioRef.current.load();

        if (isPlaying) {
          await audioRef.current.play();
        }

        // 更新 Media Session
        updateMediaSession(currentTrack);
      } catch (err) {
        console.error('[Music] 載入失敗:', err);
        setError('載入音樂失敗');
      } finally {
        setLoading(false);
      }
    };

    loadAndPlay();
  }, [currentTrack?.fileId]);

  // 播放/暫停控制
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.error('[Music] 播放失敗:', err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // 更新 Media Session（支援鎖屏控制）
  const updateMediaSession = useCallback((track) => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || track.name,
      artist: track.artist || '未知藝人',
      album: 'Google Drive 音樂',
      artwork: [
        {
          src: '/icons/icon-192x192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
        },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
    navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
    navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
  }, []);

  // 檢查權限
  const checkPermission = async () => {
    try {
      const { hasMusicPermission: checkPerm } = await import('@/lib/googleDriveMusic');
      setHasMusicPermission(checkPerm());
    } catch {
      setHasMusicPermission(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      checkPermission();
    }
  }, [isSignedIn]);

  // 請求權限並載入音樂
  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);

    try {
      const { requestMusicPermission, listMusicFiles } = await import('@/lib/googleDriveMusic');
      await requestMusicPermission();
      setHasMusicPermission(true);

      // 載入音樂列表
      const result = await listMusicFiles();
      setMusicFiles(result.files);
    } catch (err) {
      console.error('[Music] 權限請求失敗:', err);
      setError('無法取得權限');
    } finally {
      setLoading(false);
    }
  };

  // 載入音樂列表
  const loadMusicFiles = async () => {
    if (!hasMusicPermission) return;

    setLoading(true);
    setError(null);

    try {
      const { listMusicFiles } = await import('@/lib/googleDriveMusic');
      const result = await listMusicFiles();
      setMusicFiles(result.files);
    } catch (err) {
      console.error('[Music] 載入列表失敗:', err);
      setError('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  // 搜尋音樂
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMusicFiles();
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { searchMusicFiles } = await import('@/lib/googleDriveMusic');
      const files = await searchMusicFiles(searchQuery);
      setMusicFiles(files);
    } catch (err) {
      console.error('[Music] 搜尋失敗:', err);
      setError('搜尋失敗');
    } finally {
      setIsSearching(false);
    }
  };

  // 添加到播放清單
  const handleAddToPlaylist = async (file) => {
    const { parseTrackInfo } = await import('@/lib/googleDriveMusic');
    const info = parseTrackInfo(file.name);

    addToPlaylist({
      id: file.id,
      fileId: file.id,
      name: file.name,
      artist: info.artist,
      title: info.title,
    });
  };

  // 添加所有搜尋結果
  const handleAddAll = async () => {
    const { parseTrackInfo } = await import('@/lib/googleDriveMusic');

    const tracks = musicFiles.map((file) => {
      const info = parseTrackInfo(file.name);
      return {
        id: file.id,
        fileId: file.id,
        name: file.name,
        artist: info.artist,
        title: info.title,
      };
    });

    addMultipleToPlaylist(tracks);
  };

  // 進度條控制
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;

    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // 格式化時間
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 播放模式圖示
  const PlayModeIcon = () => {
    switch (playMode) {
      case PLAY_MODE.SINGLE:
        return <Repeat1 className="w-4 h-4" />;
      case PLAY_MODE.SHUFFLE:
        return <Shuffle className="w-4 h-4" />;
      case PLAY_MODE.LOOP:
        return <Repeat className="w-4 h-4 text-primary" />;
      default:
        return <Repeat className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* 浮動按鈕 */}
      <button
        onClick={() => setPlayerOpen(true)}
        className={`fixed bottom-6 right-6 z-10 p-3 rounded-full shadow-lg transition-all ${
          isPlaying
            ? 'bg-primary text-primary-foreground animate-pulse'
            : 'bg-card border border-border hover:bg-secondary'
        }`}
        aria-label="音樂播放器"
      >
        <Music className="w-5 h-5" />
      </button>

      {/* 播放器面板 */}
      {isPlayerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setPlayerOpen(false)} />
          <div className="fixed bottom-20 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* 標題列 */}
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-foreground font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-500" />
                音樂播放器
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setBrowserOpen(true);
                    if (hasMusicPermission) loadMusicFiles();
                  }}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  title="瀏覽音樂"
                >
                  <FolderOpen className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setPlaylistOpen(!isPlaylistOpen)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                  title="播放清單"
                >
                  <List className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => setPlayerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            {/* 錯誤訊息 */}
            {error && (
              <div className="px-3 py-2 bg-red-500/10 text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* 主要內容 */}
            {!isSignedIn ? (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">請先登入以使用音樂功能</p>
              </div>
            ) : !hasMusicPermission ? (
              <div className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  需要授權存取 Google Drive 音樂檔案
                </p>
                <button
                  onClick={handleRequestPermission}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    '授權存取'
                  )}
                </button>
              </div>
            ) : (
              <>
                {/* 當前曲目資訊 */}
                <div className="p-4">
                  {currentTrack ? (
                    <div className="text-center mb-3">
                      <div className="w-16 h-16 bg-secondary rounded-lg mx-auto mb-2 flex items-center justify-center">
                        <Music className="w-8 h-8 text-purple-500" />
                      </div>
                      <h4 className="text-foreground font-medium truncate">
                        {currentTrack.title || currentTrack.name}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {currentTrack.artist || '未知藝人'}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">尚未選擇音樂</p>
                    </div>
                  )}

                  {/* 進度條 */}
                  <div className="mb-3">
                    <div
                      className="h-1.5 bg-secondary rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* 控制按鈕 */}
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={cyclePlayMode}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      title={`播放模式: ${playMode}`}
                    >
                      <PlayModeIcon />
                    </button>
                    <button
                      onClick={prevTrack}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      disabled={playlist.length === 0}
                    >
                      <SkipBack className="w-5 h-5 text-foreground" />
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      disabled={!currentTrack || isLoading}
                      className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>
                    <button
                      onClick={nextTrack}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      disabled={playlist.length === 0}
                    >
                      <SkipForward className="w-5 h-5 text-foreground" />
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 text-foreground" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-foreground" />
                      )}
                    </button>
                  </div>

                  {/* 音量控制 */}
                  <div className="mt-3 flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-1 bg-secondary rounded-full appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* 播放清單面板 */}
      {isPlaylistOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setPlaylistOpen(false)} />
          <div className="fixed bottom-20 right-6 z-50 w-80 max-h-96 bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-foreground font-semibold">播放清單 ({playlist.length})</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearPlaylist}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-red-500"
                  title="清空清單"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPlaylistOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {playlist.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">播放清單是空的</p>
                </div>
              ) : (
                <ul>
                  {playlist.map((track, index) => (
                    <li
                      key={`${track.id}-${index}`}
                      className={`px-3 py-2 flex items-center gap-2 hover:bg-secondary cursor-pointer ${
                        index === currentIndex ? 'bg-primary/10' : ''
                      }`}
                      onClick={() => playTrack(index)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{track.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </div>
                      {index === currentIndex && isPlaying && (
                        <div className="w-4 h-4 flex items-center justify-center">
                          <span className="w-1 h-3 bg-primary rounded animate-pulse" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromPlaylist(index);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      {/* 瀏覽器面板 */}
      {isBrowserOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setBrowserOpen(false)} />
          <div className="fixed bottom-20 right-6 z-50 w-80 max-h-[28rem] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-foreground font-semibold">Google Drive 音樂</h3>
              <button
                onClick={() => setBrowserOpen(false)}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* 搜尋列 */}
            <div className="p-2 border-b border-border flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="搜尋音樂..."
                  className="w-full pl-8 pr-3 py-1.5 bg-secondary text-foreground text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : '搜尋'}
              </button>
            </div>

            {/* 檔案列表 */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : musicFiles.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">找不到音樂檔案</p>
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-border flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      找到 {musicFiles.length} 個檔案
                    </span>
                    <button
                      onClick={handleAddAll}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      全部加入
                    </button>
                  </div>
                  <ul>
                    {musicFiles.map((file) => (
                      <li
                        key={file.id}
                        className="px-3 py-2 flex items-center gap-2 hover:bg-secondary"
                      >
                        <Music className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        <span className="flex-1 text-sm text-foreground truncate">{file.name}</span>
                        <button
                          onClick={() => handleAddToPlaylist(file)}
                          className="p-1 rounded hover:bg-primary/20 text-primary"
                          title="加入播放清單"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
