// Google Drive 卡片資料同步模組
// 直接使用 googleDrive.js 的 saveData/loadData，不重複檢查 API 狀態

import { saveData, loadData } from './googleDrive';

// 資料夾結構
const CARDS_FOLDER = 'cards';
const METADATA_FILE = 'metadata.json';
const CONTENTS_FOLDER = 'contents';

/**
 * 儲存卡片元資料到 Google Drive
 * @param {Object} cards - 所有卡片的元資料 { cardId: cardData }
 */
export async function saveCardsMetadata(cards) {
    try {
        // 只儲存元資料，不包含完整內容
        const metadata = {};
        Object.entries(cards).forEach(([id, card]) => {
            metadata[id] = {
                id: card.id,
                title: card.title,
                summary: card.summary,
                tags: card.tags,
                color: card.color,
                position: card.position,
                links: card.links,
                createdAt: card.createdAt,
                updatedAt: card.updatedAt
            };
        });

        // 包裝 metadata 加入時間戳
        const dataToSave = {
            lastModified: new Date().toISOString(),
            cards: metadata
        };

        const filePath = `${CARDS_FOLDER}/${METADATA_FILE}`;
        await saveData(filePath, dataToSave);

        console.log('[CardSync] 元資料已同步:', Object.keys(metadata).length, '張卡片');
        return true;
    } catch (error) {
        console.log('[CardSync] 儲存元資料失敗:', error.message);
        return false;
    }
}

/**
 * 從 Google Drive 載入卡片元資料
 * @returns {Object} { cards, lastModified }
 */
export async function loadCardsMetadata() {
    try {
        const filePath = `${CARDS_FOLDER}/${METADATA_FILE}`;
        const data = await loadData(filePath);

        if (data && typeof data === 'object') {
            // 新格式：{ lastModified, cards }
            if (data.cards) {
                console.log('[CardSync] 元資料已載入:', Object.keys(data.cards).length, '張卡片');
                return {
                    cards: data.cards,
                    lastModified: data.lastModified || null
                };
            }

            // 舊格式相容：直接是 cards 物件
            console.log('[CardSync] 元資料已載入 (舊格式):', Object.keys(data).length, '張卡片');
            return {
                cards: data,
                lastModified: null
            };
        }

        console.log('[CardSync] 雲端無元資料');
        return { cards: {}, lastModified: null };
    } catch (error) {
        console.log('[CardSync] 載入元資料失敗:', error.message);
        return { cards: {}, lastModified: null };
    }
}

/**
 * 儲存單張卡片的內容到 Google Drive
 * @param {string} cardId - 卡片 ID
 * @param {string} content - Markdown 內容
 */
export async function saveCardContent(cardId, content) {
    try {
        const filePath = `${CARDS_FOLDER}/${CONTENTS_FOLDER}/${cardId}.md`;
        await saveData(filePath, content);

        console.log('[CardSync] 內容已同步:', cardId);
        return true;
    } catch (error) {
        console.log('[CardSync] 儲存內容失敗:', error.message);
        return false;
    }
}

/**
 * 從 Google Drive 載入單張卡片的內容
 * @param {string} cardId - 卡片 ID
 * @returns {string} Markdown 內容
 */
export async function loadCardContent(cardId) {
    try {
        const filePath = `${CARDS_FOLDER}/${CONTENTS_FOLDER}/${cardId}.md`;
        const content = await loadData(filePath);

        if (typeof content === 'string') {
            console.log('[CardSync] 內容已載入:', cardId);
            return content;
        }

        return '';
    } catch (error) {
        console.log('[CardSync] 載入內容失敗:', error.message);
        return '';
    }
}

/**
 * 批次載入多張卡片的內容
 * @param {string[]} cardIds - 卡片 ID 陣列
 * @returns {Object} { cardId: content }
 */
export async function loadMultipleCardContents(cardIds) {
    const contents = {};

    for (const cardId of cardIds) {
        try {
            const content = await loadCardContent(cardId);
            contents[cardId] = content;
        } catch (error) {
            console.log(`[CardSync] 載入卡片 ${cardId} 內容失敗:`, error.message);
            contents[cardId] = '';
        }
    }

    return contents;
}

/**
 * 完整載入：元資料 + 所有內容
 * @returns {Object} { cards, cardContents, lastModified }
 */
export async function fullLoad() {
    try {
        // 1. 載入元資料
        const { cards, lastModified } = await loadCardsMetadata();

        // 2. 載入所有卡片的內容
        const cardIds = Object.keys(cards);
        const cardContents = await loadMultipleCardContents(cardIds);

        console.log('[CardSync] 完整載入完成');
        return { cards, cardContents, lastModified };
    } catch (error) {
        console.log('[CardSync] 完整載入失敗:', error.message);
        return { cards: {}, cardContents: {}, lastModified: null };
    }
}
