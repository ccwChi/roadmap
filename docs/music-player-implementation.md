# 音樂播放器功能實作文檔

## 概述

本文檔詳細說明如何為 AI Roadmap 應用實作背景音樂播放功能，支援手機鎖定畫面控制。

## 功能需求

### 核心功能
1. **背景音樂播放** - 即使在手機鎖定狀態下也能持續播放
2. **鎖定畫面控制** - 在手機鎖定畫面顯示播放控制
3. **播放列表管理** - 支援多首歌曲的播放列表
4. **音量控制** - 調整播放音量
5. **播放狀態** - 播放/暫停/上一首/下一首

### 選用功能
- Lo-Fi / 專注音樂分類
- 音樂視覺化效果
- 播放進度條
- 自動播放下一首

---

## 技術架構

### 核心技術
- **HTML5 Audio API** - 音訊播放基礎
- **Media Session API** - 鎖定畫面控制整合
- **Web Audio API** - 進階音訊處理（視覺化）

### 相依套件建議
```bash
# 可選：使用 howler.js 簡化音訊控制
npm install howler

# 可選：使用 wavesurfer.js 實現波形視覺化
npm install wavesurfer.js
```

---

## 實作步驟

### 步驟 1：建立音樂播放器狀態管理

在 `store/useStore.js` 中新增音樂播放器狀態：

```javascript
// 在 useUIStore 中新增
export const useMusicStore = create((set, get) => ({
  // 播放狀態
  isPlaying: false,
  currentTrackIndex: 0,
  volume: 0.7,
  progress: 0,
  duration: 0,

  // 播放列表
  playlist: [
    {
      id: 1,
      title: 'Lo-Fi Study Beats',
      artist: 'AI Roadmap',
      src: '/audio/lofi-study.mp3',
      cover: '/images/covers/lofi-study.jpg',
    },
    {
      id: 2,
      title: 'Focus Flow',
      artist: 'AI Roadmap',
      src: '/audio/focus-flow.mp3',
      cover: '/images/covers/focus-flow.jpg',
    },
    // 更多曲目...
  ],

  // Actions
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTrackIndex: (index) => set({ currentTrackIndex: index }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setDuration: (duration) => set({ duration }),

  // 播放控制
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  nextTrack: () => {
    const { currentTrackIndex, playlist } = get();
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    set({ currentTrackIndex: nextIndex });
  },

  prevTrack: () => {
    const { currentTrackIndex, playlist } = get();
    const prevIndex = currentTrackIndex === 0
      ? playlist.length - 1
      : currentTrackIndex - 1;
    set({ currentTrackIndex: prevIndex });
  },

  getCurrentTrack: () => {
    const { playlist, currentTrackIndex } = get();
    return playlist[currentTrackIndex];
  },
}));
```

### 步驟 2：建立音樂播放器 Hook

建立 `hooks/useMusicPlayer.js`：

```javascript
'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useMusicStore } from '@/store/useStore';

export function useMusicPlayer() {
  const audioRef = useRef(null);
  const {
    isPlaying,
    currentTrackIndex,
    volume,
    playlist,
    setIsPlaying,
    setProgress,
    setDuration,
    nextTrack,
    prevTrack,
  } = useMusicStore();

  const currentTrack = playlist[currentTrackIndex];

  // 初始化 Audio 元素
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // 事件監聽
      audioRef.current.addEventListener('ended', handleTrackEnd);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('error', handleError);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('error', handleError);
      }
    };
  }, []);

  // 更新音訊來源
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.src;
      audioRef.current.load();

      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }

      // 更新 Media Session
      updateMediaSession();
    }
  }, [currentTrackIndex]);

  // 播放/暫停控制
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // 音量控制
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // 事件處理函數
  const handleTrackEnd = () => {
    nextTrack();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleError = (e) => {
    console.error('Audio error:', e);
    setIsPlaying(false);
  };

  // 設定 Media Session API（鎖定畫面控制）
  const updateMediaSession = useCallback(() => {
    if ('mediaSession' in navigator && currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: 'AI Roadmap - Focus Music',
        artwork: [
          { src: currentTrack.cover || '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
          { src: currentTrack.cover || '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
        ],
      });

      navigator.mediaSession.setActionHandler('play', () => {
        setIsPlaying(true);
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        setIsPlaying(false);
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        prevTrack();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextTrack();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (audioRef.current && details.seekTime) {
          audioRef.current.currentTime = details.seekTime;
        }
      });
    }
  }, [currentTrack, setIsPlaying, nextTrack, prevTrack]);

  // 跳轉到指定時間
  const seekTo = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  return {
    audioRef,
    currentTrack,
    seekTo,
  };
}
```

### 步驟 3：建立音樂播放器 UI 組件

更新 `components/MusicPlayer.js`：

```javascript
'use client';

import { useState } from 'react';
import {
  Music,
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ListMusic,
} from 'lucide-react';
import { useMusicStore } from '@/store/useStore';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const {
    isPlaying,
    volume,
    progress,
    duration,
    playlist,
    currentTrackIndex,
    play,
    pause,
    nextTrack,
    prevTrack,
    setVolume,
    setCurrentTrackIndex,
  } = useMusicStore();

  const { currentTrack, seekTo } = useMusicPlayer();

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    seekTo(newTime);
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <>
      {/* 音樂按鈕 */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-10 p-3 backdrop-blur-md border border-gray-700 rounded-full shadow-lg transition-all hover:scale-105 ${
          isPlaying
            ? 'bg-purple-600/80 hover:bg-purple-500'
            : 'bg-gray-800/80 hover:bg-gray-700'
        }`}
        aria-label="音樂播放器"
      >
        <Music className={`w-5 h-5 ${isPlaying ? 'text-white animate-pulse' : 'text-gray-400'}`} />
      </button>

      {/* 音樂播放器面板 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-20 right-6 z-50 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-400" />
                音樂播放器
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  className={`p-1 rounded-lg transition-colors ${
                    showPlaylist ? 'bg-purple-600' : 'hover:bg-gray-800'
                  }`}
                >
                  <ListMusic className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {showPlaylist ? (
              /* 播放列表 */
              <div className="max-h-64 overflow-y-auto">
                {playlist.map((track, index) => (
                  <button
                    key={track.id}
                    onClick={() => {
                      setCurrentTrackIndex(index);
                      play();
                    }}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-gray-800 transition-colors ${
                      index === currentTrackIndex ? 'bg-purple-600/20' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Music className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-medium ${
                        index === currentTrackIndex ? 'text-purple-400' : 'text-white'
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500">{track.artist}</p>
                    </div>
                    {index === currentTrackIndex && isPlaying && (
                      <div className="flex gap-0.5">
                        <div className="w-1 h-4 bg-purple-400 rounded animate-pulse" />
                        <div className="w-1 h-4 bg-purple-400 rounded animate-pulse delay-75" />
                        <div className="w-1 h-4 bg-purple-400 rounded animate-pulse delay-150" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              /* 播放器主介面 */
              <div className="p-4">
                {/* 專輯封面 */}
                <div className="w-full aspect-square bg-gray-800 rounded-xl mb-4 flex items-center justify-center">
                  {currentTrack?.cover ? (
                    <img
                      src={currentTrack.cover}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <Music className="w-16 h-16 text-gray-600" />
                  )}
                </div>

                {/* 曲目資訊 */}
                <div className="text-center mb-4">
                  <h4 className="text-white font-medium">{currentTrack?.title || '未選擇曲目'}</h4>
                  <p className="text-sm text-gray-400">{currentTrack?.artist || '-'}</p>
                </div>

                {/* 進度條 */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={progress}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 播放控制 */}
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={prevTrack}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <SkipBack className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="p-4 bg-purple-600 hover:bg-purple-500 rounded-full transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={nextTrack}
                    className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                  >
                    <SkipForward className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* 音量控制 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setVolume(volume > 0 ? 0 : 0.7)}
                    className="p-1 hover:bg-gray-800 rounded transition-colors"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
```

---

## 音訊檔案準備

### 檔案位置
```
public/
├── audio/
│   ├── lofi-study.mp3
│   ├── focus-flow.mp3
│   └── ambient-chill.mp3
└── images/
    └── covers/
        ├── lofi-study.jpg
        ├── focus-flow.jpg
        └── ambient-chill.jpg
```

### 音訊檔案建議
- **格式**: MP3 (相容性最佳) 或 WebM/Opus (較小檔案)
- **位元率**: 128-192 kbps (平衡品質與檔案大小)
- **取樣率**: 44.1 kHz

### 免費音樂資源
1. [Free Music Archive](https://freemusicarchive.org/) - CC 授權音樂
2. [Pixabay Music](https://pixabay.com/music/) - 免版稅音樂
3. [Mixkit](https://mixkit.co/free-stock-music/) - 免費音效與音樂
4. [Chosic](https://www.chosic.com/free-music/lofi/) - Lo-Fi 音樂

---

## iOS 背景播放注意事項

### 1. 啟用背景音訊
在 `public/manifest.json` 中確保有正確的 PWA 設定：

```json
{
  "background_color": "#030712",
  "theme_color": "#3b82f6",
  "display": "standalone",
  "orientation": "portrait"
}
```

### 2. Audio 元素設定
```javascript
// 確保 audio 元素有正確的屬性
audioRef.current.setAttribute('playsinline', '');
audioRef.current.setAttribute('webkit-playsinline', '');
```

### 3. 使用者互動要求
iOS 要求首次播放必須由使用者互動觸發：

```javascript
// 首次點擊時初始化音訊
const initAudio = async () => {
  try {
    await audioRef.current.play();
    audioRef.current.pause();
  } catch (e) {
    console.log('Audio init failed, needs user interaction');
  }
};
```

---

## Media Session API 相容性

### 支援的瀏覽器
- Chrome 73+
- Edge 79+
- Firefox 82+
- Safari 15+ (部分支援)
- iOS Safari 15.4+ (部分支援)

### 優雅降級
```javascript
if ('mediaSession' in navigator) {
  // 設定 Media Session
} else {
  console.log('Media Session API not supported');
  // 使用基本音訊控制
}
```

---

## 效能優化

### 1. 懶載入音訊
```javascript
// 只在需要時載入音訊
const loadTrack = async (trackIndex) => {
  const track = playlist[trackIndex];
  audioRef.current.src = track.src;
  await audioRef.current.load();
};
```

### 2. 預載入下一首
```javascript
// 預載入下一首歌曲
const preloadNextTrack = () => {
  const nextIndex = (currentTrackIndex + 1) % playlist.length;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = playlist[nextIndex].src;
  document.head.appendChild(link);
};
```

### 3. 音訊串流
對於較長的音訊檔案，考慮使用 HLS 串流：

```javascript
// 使用 hls.js 進行串流播放
import Hls from 'hls.js';

if (Hls.isSupported()) {
  const hls = new Hls();
  hls.loadSource('/audio/stream.m3u8');
  hls.attachMedia(audioRef.current);
}
```

---

## 測試清單

- [ ] 播放/暫停功能正常
- [ ] 上一首/下一首切換正常
- [ ] 進度條可拖曳跳轉
- [ ] 音量控制正常
- [ ] 播放列表顯示正確
- [ ] 自動播放下一首
- [ ] iOS 鎖定畫面顯示控制
- [ ] Android 通知列顯示控制
- [ ] 桌面瀏覽器 Media Session 正常
- [ ] 離線播放（PWA 快取）

---

## 未來擴展

1. **音樂視覺化** - 使用 Web Audio API 分析頻譜
2. **歌詞顯示** - 同步顯示歌詞
3. **自訂播放列表** - 使用者建立專屬列表
4. **音效模式** - 專注/放鬆/睡眠模式
5. **計時器** - 學習計時與番茄鐘整合
6. **社群分享** - 分享正在聆聽的曲目
