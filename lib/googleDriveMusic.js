// Google Drive 音樂 API
// 用於讀取 Google Drive 上的音樂檔案

// 音樂檔案需要額外的權限
const MUSIC_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

// 支援的音訊格式
const AUDIO_MIME_TYPES = [
  'audio/mpeg',       // .mp3
  'audio/mp4',        // .m4a
  'audio/ogg',        // .ogg
  'audio/wav',        // .wav
  'audio/webm',       // .webm
  'audio/flac',       // .flac
  'audio/aac',        // .aac
];

// 音訊檔案副檔名查詢
const AUDIO_EXTENSIONS = ['mp3', 'm4a', 'ogg', 'wav', 'webm', 'flac', 'aac'];

// 檢查是否已有音樂權限
export const hasMusicPermission = () => {
  if (typeof window === 'undefined') return false;
  const token = window.gapi?.client?.getToken();
  if (!token) return false;

  // 檢查 scope 是否包含 drive.readonly
  const scopes = token.scope?.split(' ') || [];
  return scopes.some((s) => s.includes('drive.readonly') || s.includes('drive'));
};

// 請求音樂權限（增量授權）
export const requestMusicPermission = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('僅在瀏覽器環境可用'));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google API 尚未初始化'));
      return;
    }

    // 取得現有的 scopes
    const existingToken = window.gapi?.client?.getToken();
    const existingScopes = existingToken?.scope || '';

    // 建立新的 tokenClient 來請求額外權限
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      scope: `${existingScopes} ${MUSIC_SCOPE}`.trim(),
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(true);
      },
    });

    // 增量授權
    tokenClient.requestAccessToken({
      prompt: existingToken ? '' : 'consent',
    });
  });
};

// 確保有音樂權限
const ensureMusicPermission = async () => {
  if (!hasMusicPermission()) {
    await requestMusicPermission();
  }
  return true;
};

// 列出音樂資料夾
export const listMusicFolders = async () => {
  await ensureMusicPermission();

  try {
    const response = await window.gapi.client.drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name, modifiedTime)',
      orderBy: 'name',
      pageSize: 100,
    });

    return response.result.files || [];
  } catch (error) {
    console.error('[Music] 列出資料夾失敗:', error);
    throw error;
  }
};

// 列出音樂檔案
export const listMusicFiles = async (folderId = null, pageToken = null) => {
  await ensureMusicPermission();

  try {
    // 建立查詢條件
    const mimeTypeQueries = AUDIO_MIME_TYPES.map((t) => `mimeType='${t}'`).join(' or ');
    let query = `(${mimeTypeQueries}) and trashed=false`;

    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const response = await window.gapi.client.drive.files.list({
      q: query,
      fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, parents, thumbnailLink)',
      orderBy: 'name',
      pageSize: 50,
      pageToken: pageToken,
    });

    return {
      files: response.result.files || [],
      nextPageToken: response.result.nextPageToken,
    };
  } catch (error) {
    console.error('[Music] 列出音樂檔案失敗:', error);
    throw error;
  }
};

// 搜尋音樂檔案
export const searchMusicFiles = async (query) => {
  await ensureMusicPermission();

  try {
    const mimeTypeQueries = AUDIO_MIME_TYPES.map((t) => `mimeType='${t}'`).join(' or ');
    const searchQuery = `(${mimeTypeQueries}) and trashed=false and name contains '${query}'`;

    const response = await window.gapi.client.drive.files.list({
      q: searchQuery,
      fields: 'files(id, name, mimeType, size, modifiedTime, thumbnailLink)',
      orderBy: 'name',
      pageSize: 30,
    });

    return response.result.files || [];
  } catch (error) {
    console.error('[Music] 搜尋音樂失敗:', error);
    throw error;
  }
};

// 取得音樂檔案的播放 URL
export const getMusicStreamUrl = async (fileId) => {
  await ensureMusicPermission();

  const token = window.gapi.client.getToken();
  if (!token?.access_token) {
    throw new Error('無法取得存取權杖');
  }

  // Google Drive 直接串流 URL
  // 注意：這個 URL 需要帶有 access_token
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${token.access_token}`;
};

// 取得檔案的元資料
export const getMusicMetadata = async (fileId) => {
  await ensureMusicPermission();

  try {
    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, modifiedTime, thumbnailLink, imageMediaMetadata',
    });

    return response.result;
  } catch (error) {
    console.error('[Music] 取得檔案資訊失敗:', error);
    throw error;
  }
};

// 從檔名解析歌曲資訊
export const parseTrackInfo = (filename) => {
  // 移除副檔名
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');

  // 嘗試解析 "藝人 - 歌名" 格式
  const dashMatch = nameWithoutExt.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (dashMatch) {
    return {
      artist: dashMatch[1].trim(),
      title: dashMatch[2].trim(),
    };
  }

  // 嘗試解析 "01. 歌名" 或 "01 歌名" 格式
  const trackMatch = nameWithoutExt.match(/^\d+\.?\s*(.+)$/);
  if (trackMatch) {
    return {
      artist: '未知藝人',
      title: trackMatch[1].trim(),
    };
  }

  return {
    artist: '未知藝人',
    title: nameWithoutExt.trim(),
  };
};

// 格式化檔案大小
export const formatFileSize = (bytes) => {
  if (!bytes) return '未知';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

// 格式化時間長度
export const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
