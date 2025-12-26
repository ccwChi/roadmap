// Google Drive API 整合
// 用戶需要在 Google Cloud Console 建立 OAuth 2.0 憑證

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
// 需要包含 userinfo scope 才能讀取用戶資訊
const SCOPES = [
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// 資料檔案名稱
const DATA_FILENAME = 'roadmap-data.json';

let tokenClient = null;
let gapiInited = false;
let gisInited = false;

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

    // 載入 GAPI
    if (!document.getElementById('google-gapi')) {
      const gapiScript = document.createElement('script');
      gapiScript.id = 'google-gapi';
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.async = true;
      gapiScript.defer = true;
      gapiScript.onload = () => {
        window.gapi.load('client', async () => {
          await window.gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
          });
          gapiInited = true;
          checkReady(resolve);
        });
      };
      document.head.appendChild(gapiScript);
    } else {
      gapiInited = true;
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
        checkReady(resolve);
      };
      document.head.appendChild(gisScript);
    } else {
      gisInited = true;
    }

    function checkReady(resolve) {
      if (gapiInited && gisInited) {
        resolve(true);
      }
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
};

// 取得使用者資訊
const getUserInfo = async () => {
  const token = window.gapi.client.getToken();
  if (!token || !token.access_token) {
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

// ===== Google Drive 資料操作 =====

// 尋找或建立資料檔案
const findOrCreateDataFile = async () => {
  try {
    // 搜尋 appDataFolder 中的檔案
    const response = await window.gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
      q: `name='${DATA_FILENAME}'`,
    });

    const files = response.result.files;
    if (files && files.length > 0) {
      return files[0].id;
    }

    // 建立新檔案
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: DATA_FILENAME,
        parents: ['appDataFolder'],
      },
      fields: 'id',
    });

    return createResponse.result.id;
  } catch (error) {
    console.error('尋找/建立檔案失敗:', error);
    throw error;
  }
};

// 讀取所有資料
export const loadData = async () => {
  try {
    const fileId = await findOrCreateDataFile();

    const response = await window.gapi.client.drive.files.get({
      fileId: fileId,
      alt: 'media',
    });

    // 如果是空檔案，回傳預設結構
    if (!response.body || response.body === '') {
      return getDefaultData();
    }

    return JSON.parse(response.body);
  } catch (error) {
    console.error('讀取資料失敗:', error);
    return getDefaultData();
  }
};

// 儲存所有資料
export const saveData = async (data) => {
  try {
    const fileId = await findOrCreateDataFile();

    await window.gapi.client.request({
      path: `/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: {
        uploadType: 'media',
      },
      body: JSON.stringify(data),
    });

    return true;
  } catch (error) {
    console.error('儲存資料失敗:', error);
    return false;
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