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
const DATA_FILENAME = 'roadmap-data.json';
const DATA_FOLDER_NAME = 'AI-Roadmap-Data'; // 使用者可見的資料夾名稱

// 快取資料夾 ID，避免重複查詢
let cachedFolderId = null;

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

// ===== Google Drive 資料操作 =====

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

// ===== 尋找或建立資料夾 =====

// 尋找或建立應用程式資料夾（使用者可見）
const findOrCreateDataFolder = async () => {
  ensureGoogleApiReady();

  // 使用快取
  if (cachedFolderId) {
    return cachedFolderId;
  }

  try {
    // 搜尋資料夾
    const response = await window.gapi.client.drive.files.list({
      q: `name='${DATA_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const folders = response.result.files;
    if (folders && folders.length > 0) {
      cachedFolderId = folders[0].id;
      return cachedFolderId;
    }

    // 建立新資料夾
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: DATA_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    cachedFolderId = createResponse.result.id;
    console.log('[GoogleDrive] 已建立資料夾:', DATA_FOLDER_NAME);
    return cachedFolderId;
  } catch (error) {
    console.error('尋找/建立資料夾失敗:', error);
    throw error;
  }
};

// 尋找或建立資料檔案（使用者可見版本）
const findOrCreateDataFile = async () => {
  ensureGoogleApiReady();

  try {
    // 先取得資料夾 ID
    const folderId = await findOrCreateDataFolder();

    // 搜尋資料夾中的檔案
    const response = await window.gapi.client.drive.files.list({
      q: `name='${DATA_FILENAME}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }

    // 建立新檔案
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: DATA_FILENAME,
        parents: [folderId],
        mimeType: 'application/json',
      },
      fields: 'id',
    });

    console.log('[GoogleDrive] 已建立資料檔案:', DATA_FILENAME);
    return createResponse.result.id;
  } catch (error) {
    // 處理特定錯誤
    if (error.status === 401 || error.status === 403) {
      throw new Error('存取權限不足，請重新登入');
    }
    if (error.status === 404) {
      throw new Error('找不到資料夾');
    }
    console.error('尋找/建立檔案失敗:', error);
    throw error;
  }
};

/* ==========================================================================
 * 隱藏資料夾版本 (appDataFolder) - 使用者無法在 Google Drive 中看到
 *
 * 優點：不會弄亂使用者的 Drive 空間
 * 缺點：使用者無法直接查看/編輯資料，除錯困難
 *
 * 如需切換回隱藏版本，將上方的 findOrCreateDataFile 替換為以下程式碼：
 * ==========================================================================
 *
 * const findOrCreateDataFile_Hidden = async () => {
 *   ensureGoogleApiReady();
 *
 *   try {
 *     // 搜尋 appDataFolder 中的檔案（隱藏資料夾，使用者看不到）
 *     const response = await window.gapi.client.drive.files.list({
 *       spaces: 'appDataFolder',
 *       fields: 'files(id, name)',
 *       q: `name='${DATA_FILENAME}'`,
 *     });
 *
 *     const files = response.result.files;
 *     if (files && files.length > 0) {
 *       return files[0].id;
 *     }
 *
 *     // 建立新檔案
 *     const createResponse = await window.gapi.client.drive.files.create({
 *       resource: {
 *         name: DATA_FILENAME,
 *         parents: ['appDataFolder'],
 *       },
 *       fields: 'id',
 *     });
 *
 *     return createResponse.result.id;
 *   } catch (error) {
 *     if (error.status === 401 || error.status === 403) {
 *       throw new Error('存取權限不足，請重新登入');
 *     }
 *     if (error.status === 404) {
 *       throw new Error('找不到應用資料夾');
 *     }
 *     console.error('尋找/建立檔案失敗:', error);
 *     throw error;
 *   }
 * };
 *
 * 注意：使用隱藏版本時，需確保 SCOPES 包含 'drive.appdata'
 * ========================================================================== */

// 讀取所有資料
export const loadData = async () => {
  try {
    ensureGoogleApiReady();
    const fileId = await findOrCreateDataFile();

    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    // 如果是空檔案，回傳預設結構
    if (!response.body || response.body === '' || response.body === '{}') {
      console.log('[GoogleDrive] 雲端檔案為空，返回預設資料');
      return getDefaultData();
    }

    try {
      const parsed = JSON.parse(response.body);
      // 驗證資料結構
      if (typeof parsed !== 'object' || parsed === null) {
        console.warn('[GoogleDrive] 雲端資料格式異常，返回預設資料');
        return getDefaultData();
      }
      return parsed;
    } catch (parseError) {
      console.error('[GoogleDrive] JSON 解析失敗:', parseError);
      return getDefaultData();
    }
  } catch (error) {
    // 處理特定錯誤碼
    if (error.status === 401 || error.status === 403) {
      console.error('[GoogleDrive] 存取權限問題:', error);
      throw new Error('存取權限不足，請重新登入');
    }
    if (error.message?.includes('未初始化') || error.message?.includes('未登入')) {
      console.warn('[GoogleDrive] API 未就緒:', error.message);
      throw error;
    }
    console.error('讀取資料失敗:', error);
    // 對於其他錯誤，返回預設資料而不是拋出錯誤
    return getDefaultData();
  }
};

// 儲存所有資料
export const saveData = async (data) => {
  try {
    ensureGoogleApiReady();
    const fileId = await findOrCreateDataFile();

    // 確保資料包含更新時間
    const dataToSave = {
      ...data,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };

    await window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: {
        uploadType: 'media',
      },
      body: JSON.stringify(dataToSave),
    });

    return true;
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

// 預設資料結構
const getDefaultData = () => ({
  progress: {}, // { roadmapId: [nodeId1, nodeId2, ...] }
  notes: {}, // { roadmapId: { nodeId: "note content" } }
  settings: {
    theme: 'dark',
    currentRoadmap: 'ai-agents',
  },
  updatedAt: new Date().toISOString(),
});

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