// Google Drive API 整合
// 用戶需要在 Google Cloud Console 建立 OAuth 2.0 憑證

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

// 需要包含 userinfo scope 才能讀取用戶資訊
// drive.file: 可以存取應用程式建立的檔案（使用者可見）
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file', // 存取應用程式建立的檔案
  'https://www.googleapis.com/auth/drive.appdata', // 保留 appdata 權限以便未來切換
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// 資料檔案名稱與資料夾名稱
const DATA_FILENAME = 'learningmap-data.json';
const DATA_FOLDER_NAME = 'LearningMap-Data'; // 使用者可見的資料夾名稱

// 快取資料夾 ID，避免重複查詢
let cachedFolderId = null;

const LOCAL_STORAGE_TOKEN_KEY = 'google_drive_token';

// 恢復 Session
const restoreSession = () => {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_TOKEN_KEY);
    if (stored) {
      const token = JSON.parse(stored);
      const now = Date.now();

      // 檢查過期 (預留 60 秒緩衝)
      if (token.expires_at && token.expires_at > now + 60000) {
        console.log('[GoogleAuth] 恢復 Token from LocalStorage');
        window.gapi.client.setToken(token);
        return true;
      } else {
        console.log('[GoogleAuth] Token 已過期，清除');
        localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
      }
    }
  } catch (e) {
    console.error('[GoogleAuth] 恢復 Token 失敗', e);
  }
  return false;
};

// 儲存 Session
const saveSession = (tokenResponse) => {
  const now = Date.now();
  const token = {
    ...tokenResponse,
    expires_at: now + (tokenResponse.expires_in * 1000)
  };
  localStorage.setItem(LOCAL_STORAGE_TOKEN_KEY, JSON.stringify(token));
};

// Google API 初始化狀態
let gapiInited = false;
let gisInited = false;
let tokenClient = null;

// 檢查是否已設定 Google API
export const isGoogleConfigured = () => {
  return Boolean(CLIENT_ID);
};

// 載入 Google API 腳本
export const loadGoogleScripts = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('僅在瀏覽器環境可用'));
      return;
    }

    // 如果已經完全初始化，直接返回
    if (gapiInited && gisInited) {
      resolve(true);
      return;
    }

    function checkReady() {
      if (gapiInited && gisInited) {
        restoreSession();
        resolve(true);
      }
    }

    // 載入 GAPI
    if (!document.getElementById('google-gapi')) {
      const gapiScript = document.createElement('script');
      gapiScript.id = 'google-gapi';
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          try {
            await window.gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            gapiInited = true;
            checkReady();
          } catch (error) {
            reject(error);
          }
        });
      };
      gapiScript.onerror = () => reject(new Error('Failed to load Google API script'));
      document.head.appendChild(gapiScript);
    } else if (window.gapi?.client) {
      // 腳本已存在且已初始化
      gapiInited = true;
      checkReady();
    }

    // 載入 GIS (Google Identity Services)
    if (!document.getElementById('google-gis')) {
      const gisScript = document.createElement('script');
      gisScript.id = 'google-gis';
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.async = true;
      gisScript.defer = true;
      gisScript.onload = () => {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '', // 會在 signIn 時設定
        });
        gisInited = true;
        checkReady();
      };
      gisScript.onerror = () => reject(new Error('Failed to load Google Identity Services script'));
      document.head.appendChild(gisScript);
    } else if (window.google?.accounts?.oauth2) {
      // 腳本已存在且已初始化
      if (!tokenClient) {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: '',
        });
      }
      gisInited = true;
      checkReady();
    }
  });
};

// Google 登入
export const signIn = () => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google API 尚未初始化'));
      return;
    }

    tokenClient.callback = async (response) => {
      if (response.error) {
        reject(response);
        return;
      }

      // 儲存 Token
      saveSession(response);

      // 取得使用者資訊
      try {
        const userInfo = await getUserInfo();
        resolve(userInfo);
      } catch (error) {
        reject(error);
      }
    };

    // 檢查是否已有 token
    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

// 登出
export const signOut = () => {
  const token = window.gapi?.client?.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken(null);
  }
  localStorage.removeItem(LOCAL_STORAGE_TOKEN_KEY);
  // 清除資料夾 ID 快取
  cachedFolderId = null;
};

// 取得使用者資訊
const getUserInfo = async () => {
  const token = window.gapi?.client?.getToken();
  if (!token?.access_token) {
    throw new Error('無法取得存取權杖');
  }

  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`取得使用者資訊失敗: ${response.status}`);
  }

  return response.json();
};

// 檢查是否已登入
export const isSignedIn = () => {
  return window.gapi?.client?.getToken() !== null;
};

// 檢查 Google API 是否完全就緒（包含 token）
export const isGoogleApiReady = () => {
  if (typeof window === 'undefined') return false;
  return !!(
    window.gapi?.client?.getToken() &&
    window.gapi?.client?.drive
  );
};

// 等待 Google API 就緒
export const waitForGoogleApiReady = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (isGoogleApiReady()) {
      resolve(true);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (isGoogleApiReady()) {
        clearInterval(checkInterval);
        resolve(true);
        return;
      }

      if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error('等待 Google API 就緒超時'));
      }
    }, 100);
  });
};

// ===== Google Drive 資料操作（通用版） =====

// 檢查 Google API 是否就緒
const ensureGoogleApiReady = () => {
  if (typeof window === 'undefined') {
    throw new Error('僅在瀏覽器環境可用');
  }

  if (!window.gapi?.client) {
    throw new Error('Google API Client 未初始化');
  }

  if (!window.gapi.client.getToken()) {
    throw new Error('未登入或存取權杖已過期');
  }

  if (!window.gapi.client.drive) {
    throw new Error('Google Drive API 未載入');
  }

  return true;
};

// 尋找或建立資料夾 (Generic)
const findOrCreateFolder = async (parentId, folderName) => {
  ensureGoogleApiReady();

  // 1. 搜尋
  const q = `name='${folderName}' and '${parentId || 'root'}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;

  const response = await window.gapi.client.drive.files.list({
    q: q,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.result.files && response.result.files.length > 0) {
    return response.result.files[0].id;
  }

  // 2. 建立
  const createResponse = await window.gapi.client.drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });

  return createResponse.result.id;
};

// 取得根資料夾 ID (Singleton pattern)
const getRootDataFolderId = async () => {
  if (cachedFolderId) return cachedFolderId;
  cachedFolderId = await findOrCreateFolder(null, DATA_FOLDER_NAME);
  return cachedFolderId;
};

// 遞迴解析資料夾路徑，返回最後一個資料夾的 ID
const resolveFolderPath = async (pathString) => {
  // e.g. "cards/contents" -> ["cards", "contents"]
  const parts = pathString.split('/').filter(p => p && p.trim() !== '');

  let currentId = await getRootDataFolderId();

  for (const part of parts) {
    currentId = await findOrCreateFolder(currentId, part);
  }
  return currentId;
};

// 尋找檔案
const findFile = async (parentId, fileName) => {
  const response = await window.gapi.client.drive.files.list({
    q: `name='${fileName}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  const files = response.result.files;
  if (files && files.length > 0) {
    return files[0].id;
  }
  return null;
};

// 儲存檔案（核心函數）
// path: "roadmap.json" 或 "cards/metadata.json"
// content: 物件或字串
const saveFile = async (path, content) => {
  ensureGoogleApiReady();

  // 1. 解析路徑
  const parts = path.split('/');
  const fileName = parts.pop(); // 最後一個是檔名
  const folderPath = parts.join('/'); // 前面是資料夾路徑

  // 2. 確保資料夾存在
  let folderId = await getRootDataFolderId();
  if (folderPath) {
    folderId = await resolveFolderPath(folderPath);
  }

  // 3. 處理內容
  const fileContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
  const mimeType = fileName.endsWith('.json') ? 'application/json' : 'text/markdown';

  // 4. 尋找現有檔案
  const existingFileId = await findFile(folderId, fileName);

  if (existingFileId) {
    // 5. 更新檔案 (使用 PATCH upload)
    await window.gapi.client.request({
      path: `/upload/drive/v3/files/${existingFileId}`,
      method: 'PATCH',
      params: { uploadType: 'media' },
      body: fileContent,
    });
    return existingFileId;
  } else {
    // 6. 建立新檔案 (使用 Multipart upload 以同時設定 metadata 和 content)
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const metadata = {
      name: fileName,
      mimeType: mimeType,
      parents: [folderId]
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      fileContent +
      close_delim;

    const request = window.gapi.client.request({
      'path': '/upload/drive/v3/files',
      'method': 'POST',
      'params': { 'uploadType': 'multipart' },
      'headers': {
        'Content-Type': 'multipart/related; boundary="' + boundary + '"'
      },
      'body': multipartRequestBody
    });

    const response = await request;
    return response.result.id;
  }
};

// 讀取檔案（核心函數）
const loadFile = async (path) => {
  ensureGoogleApiReady();

  // 1. 解析路徑
  const parts = path.split('/');
  const fileName = parts.pop();
  const folderPath = parts.join('/');

  // 2. 獲取資料夾 ID
  let folderId = await getRootDataFolderId();
  if (folderPath) {
    folderId = await resolveFolderPath(folderPath);
  }

  // 3. 尋找檔案
  const fileId = await findFile(folderId, fileName);
  if (!fileId) return null;

  // 4.讀取內容
  const response = await window.gapi.client.drive.files.get({
    fileId: fileId,
    alt: 'media',
  });

  let body = response.body;
  if (!body) return null;

  // 嘗試解析 JSON
  if (fileName.endsWith('.json')) {
    try {
      return JSON.parse(body);
    } catch (e) {
      console.warn('JSON 解析失敗，返回原始字串', e);
      return body;
    }
  }

  return body;
};

// 預設資料結構 (僅供相容舊版使用)
const getDefaultData = () => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  updatedAt: new Date().toISOString(),
});


// ===== 公開 API (Facade Pattern for Backward Compatibility) =====

// 讀取資料
// 如果 path 存在且是字串，則讀取該路徑
// 否則讀取預設的 DATA_FILENAME (learningmap-data.json)
export const loadData = async (path = null) => {
  try {
    ensureGoogleApiReady();

    const targetPath = (typeof path === 'string' && path) ? path : DATA_FILENAME;
    const data = await loadFile(targetPath);

    // 舊版兼容：如果讀不到資料但 targetPath 是預設值，返回預設資料
    if (!data && targetPath === DATA_FILENAME) {
      return getDefaultData();
    }

    return data;

  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw new Error('存取權限不足，請重新登入');
    }
    if (error.message?.includes('未初始化') || error.message?.includes('未登入')) {
      throw error;
    }
    console.error('讀取資料失敗:', error);
    return null;
  }
};

// 儲存資料
// 用法 1: saveData(dataObject) -> 存到 learningmap-data.json (Legacy)
// 用法 2: saveData(pathString, content) -> 存到指定路徑 (New)
export const saveData = async (dataOrPath, content = null) => {
  try {
    ensureGoogleApiReady();

    if (typeof dataOrPath === 'string') {
      // 新用法: saveData('cards/metadata.json', data)
      return await saveFile(dataOrPath, content);
    } else {
      // 舊用法: saveData({ nodes: ... })
      const data = dataOrPath;
      const dataToSave = {
        ...data,
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
      return await saveFile(DATA_FILENAME, dataToSave);
    }
  } catch (error) {
    // 處理特定錯誤碼
    if (error.status === 401 || error.status === 403) {
      throw new Error('存取權限不足，請重新登入');
    }
    if (error.status === 404) {
      throw new Error('找不到要儲存的檔案');
    }
    console.error('[GoogleDrive] 儲存資料失敗:', error);
    throw error;
  }
};

// 合併本地資料與雲端資料
export const mergeData = (localData, cloudData) => {
  // 使用較新的資料
  const localTime = new Date(localData.updatedAt || 0).getTime();
  const cloudTime = new Date(cloudData.updatedAt || 0).getTime();

  if (cloudTime > localTime) {
    return cloudData;
  }
  return localData;
};