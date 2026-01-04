import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ===== 輔助函數 =====

// 生成唯一卡片 ID
const generateCardId = () => `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 驗證並修復卡片資料
const validateCard = (card) => {
    if (!card || typeof card !== 'object') return null;

    return {
        id: card.id || generateCardId(),
        title: card.title || '未命名卡片',
        summary: Array.isArray(card.summary) ? card.summary : [],
        tags: Array.isArray(card.tags) ? card.tags : [],
        color: card.color || '#3b82f6',
        position: {
            x: card.position?.x ?? 0,
            y: card.position?.y ?? 0,
            z: card.position?.z ?? 0
        },
        links: Array.isArray(card.links) ? card.links : [],
        createdAt: card.createdAt || new Date().toISOString(),
        updatedAt: card.updatedAt || new Date().toISOString()
    };
};

// 驗證並修復所有卡片
const validateCards = (cards) => {
    if (!cards || typeof cards !== 'object') return {};

    const validated = {};
    Object.entries(cards).forEach(([id, card]) => {
        const validCard = validateCard(card);
        if (validCard) {
            validated[id] = validCard;
        }
    });
    return validated;
};

// 解析 Markdown 中的卡片連結
function parseMarkdownLinks(markdown) {
    if (!markdown) return [];

    const cardIds = new Set();

    // 解析 [[card-id]] 格式
    const wikiLinkRegex = /\[\[([^\]]+)\]\]/g;
    let match;
    while ((match = wikiLinkRegex.exec(markdown)) !== null) {
        cardIds.add(match[1]);
    }

    // 解析 [text](card://card-id) 格式
    const cardLinkRegex = /\[([^\]]+)\]\(card:\/\/([^)]+)\)/g;
    while ((match = cardLinkRegex.exec(markdown)) !== null) {
        cardIds.add(match[2]);
    }

    return Array.from(cardIds);
}



// ===== Zustand Store =====

export const useCardStore = create(
    persist(
        (set, get) => ({
            // ===== 卡片資料 =====
            cards: {},                        // { cardId: cardData }

            // ===== 完整內容（不持久化，按需載入） =====
            cardContents: {},                 // { cardId: markdownContent }

            // ===== 視圖模式 =====
            viewMode: '2d',                   // '2d' | '3d'
            setViewMode: (mode) => set({ viewMode: mode }),

            // ===== 顯示設定 =====
            // ===== 顯示設定 =====
            showHiddenLinks: false,           // 是否顯示隱藏連線
            toggleHiddenLinks: () => set(state => ({
                showHiddenLinks: !state.showHiddenLinks
            })),

            // ===== 同步狀態 =====
            isSyncing: false,
            isLoading: false, // 從雲端載入資料中
            lastModified: null, // 本地最後修改時間
            lastSyncedCloudTime: null, // 上次同步時的雲端時間戳（用於檢測其他裝置的變更）
            syncConflict: null, // 同步衝突資訊（用於背景同步時檢測到衝突）

            // ===== 髒檢查 (Dirty Checking) =====
            unsavedChanges: {
                metadata: false,
                contents: new Set() // Set<cardId>
            },

            markMetadataDirty: () => set(state => ({
                unsavedChanges: { ...state.unsavedChanges, metadata: true },
                lastModified: new Date().toISOString()
            })),

            markContentDirty: (cardId) => set(state => {
                const newContents = new Set(state.unsavedChanges.contents);
                newContents.add(cardId);
                return {
                    unsavedChanges: { ...state.unsavedChanges, contents: newContents },
                    lastModified: new Date().toISOString()
                };
            }),

            clearDirtyFlags: (syncedMetadata, syncedContentIds) => set(state => {
                const newContents = new Set(state.unsavedChanges.contents);
                syncedContentIds.forEach(id => newContents.delete(id));

                return {
                    unsavedChanges: {
                        metadata: syncedMetadata ? false : state.unsavedChanges.metadata,
                        contents: newContents
                    }
                };
            }),

            // ===== CRUD 操作 =====

            // 新增卡片
            addCard: (cardData) => {
                const id = cardData?.id || generateCardId();
                const newCard = validateCard({
                    ...cardData,
                    id,
                    links: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                if (!newCard) return null;

                set(state => ({
                    cards: { ...state.cards, [id]: newCard }
                }));

                get().markMetadataDirty();
                get().syncToCloud();

                return id;
            },

            // 更新卡片
            updateCard: (cardId, updates) => {
                const currentCard = get().cards[cardId];
                if (!currentCard) return;

                const updatedCard = validateCard({
                    ...currentCard,
                    ...updates,
                    id: cardId,
                    updatedAt: new Date().toISOString()
                });

                if (!updatedCard) return;

                set(state => ({
                    cards: {
                        ...state.cards,
                        [cardId]: updatedCard
                    }
                }));

                get().markMetadataDirty();
                get().syncToCloud();
            },

            // 刪除卡片
            deleteCard: (cardId) => {
                set(state => {
                    const newCards = { ...state.cards };
                    delete newCards[cardId];

                    // 刪除相關連線
                    Object.values(newCards).forEach(card => {
                        card.links = card.links.filter(link => link.targetId !== cardId);
                    });

                    // 刪除內容
                    const newContents = { ...state.cardContents };
                    delete newContents[cardId];

                    return {
                        cards: newCards,
                        cardContents: newContents
                    };
                });

                get().markMetadataDirty();
                get().syncToCloud();
            },

            // 重置所有資料 (開發/測試用)
            resetStore: () => {
                set({
                    cards: {},
                    cardContents: {},
                    selectedCardId: null
                });
                // 清除 localStorage
                localStorage.removeItem('card-storage');
            },

            // ===== 連線操作 =====

            // 新增連線
            addLink: (sourceId, targetId, linkData = {}) => {
                const sourceCard = get().cards[sourceId];
                if (!sourceCard) return;

                // 檢查連線是否已存在
                const linkExists = sourceCard.links.some(link => link.targetId === targetId);
                if (linkExists) return;

                const newLink = {
                    targetId,
                    type: linkData.type || 'reference',
                    label: linkData.label || '',
                    isHidden: linkData.isHidden || false
                };

                set(state => ({
                    cards: {
                        ...state.cards,
                        [sourceId]: {
                            ...sourceCard,
                            links: [...sourceCard.links, newLink],
                            updatedAt: new Date().toISOString()
                        }
                    }
                }));

                get().syncToCloud();
            },

            // 刪除連線
            removeLink: (sourceId, targetId) => {
                const sourceCard = get().cards[sourceId];
                if (!sourceCard) return;

                set(state => ({
                    cards: {
                        ...state.cards,
                        [sourceId]: {
                            ...sourceCard,
                            links: sourceCard.links.filter(link => link.targetId !== targetId),
                            updatedAt: new Date().toISOString()
                        }
                    }
                }));

                get().syncToCloud();
            },

            // ===== 內容管理（按需載入） =====

            // 載入卡片內容
            loadCardContent: async (cardId) => {
                const { cardContents } = get();
                if (cardContents[cardId]) return; // 已載入

                // 先從 localStorage 載入
                try {
                    const stored = localStorage.getItem(`card-content-${cardId}`);
                    const content = stored || '';

                    set(state => ({
                        cardContents: {
                            ...state.cardContents,
                            [cardId]: content
                        }
                    }));
                } catch (error) {
                    console.error('載入卡片內容失敗:', error);
                }
            },

            // 更新卡片內容
            updateCardContent: (cardId, content) => {
                set(state => ({
                    cardContents: {
                        ...state.cardContents,
                        [cardId]: content
                    }
                }));

                get().markContentDirty(cardId);
                get().syncToCloud();

                // 儲存到 localStorage
                try {
                    localStorage.setItem(`card-content-${cardId}`, content);
                } catch (error) {
                    console.error('儲存卡片內容失敗:', error);
                }

                // 解析 Markdown 中的連結，建立隱藏連線
                const linkedCardIds = parseMarkdownLinks(content);
                const currentCard = get().cards[cardId];

                if (currentCard) {
                    // 移除舊的隱藏連線
                    const existingLinks = currentCard.links.filter(link => !link.isHidden);

                    // 建立新的隱藏連線
                    const newHiddenLinks = linkedCardIds
                        .filter(targetId => get().cards[targetId]) // 只連結存在的卡片
                        .map(targetId => ({
                            targetId,
                            type: 'reference',
                            label: '文字連結',
                            isHidden: true
                        }));

                    get().updateCard(cardId, {
                        links: [...existingLinks, ...newHiddenLinks]
                    });
                }
            },

            // 卸載卡片內容（釋放記憶體）
            unloadCardContent: (cardId) => {
                set(state => {
                    const newContents = { ...state.cardContents };
                    delete newContents[cardId];
                    return { cardContents: newContents };
                });
            },

            // ===== 雲端同步 (使用 Dirty Checking) =====
            syncToCloud: (() => {
                let timeout = null;
                return () => {
                    if (timeout) clearTimeout(timeout);
                    timeout = setTimeout(async () => {
                        const { unsavedChanges, cards, cardContents } = get();
                        const metadataDirty = unsavedChanges.metadata;
                        const contentDirtyIds = Array.from(unsavedChanges.contents);

                        if (!metadataDirty && contentDirtyIds.length === 0) {
                            return; // 無需同步
                        }

                        console.log('[CardSync] === 開始差異同步 ===');
                        console.log('[CardSync] 待同步項目:', {
                            metadata: metadataDirty,
                            contents: contentDirtyIds.length
                        });

                        // 檢查登入狀態
                        try {
                            const { useStore } = await import('@/store/useStore');
                            const isSignedIn = useStore.getState().isSignedIn;
                            if (!isSignedIn) {
                                console.log('[CardSync] ❌ 未登入，跳過同步');
                                return;
                            }
                        } catch (e) {
                            console.log('[CardSync] ❌ 檢查登入狀態失敗');
                            return;
                        }

                        set({ isSyncing: true });

                        try {
                            // 等待 Google API 就緒
                            const { waitForGoogleApiReady } = await import('@/lib/googleDrive');
                            await waitForGoogleApiReady(5000);

                            const { saveCardsMetadata, saveCardContent, loadCardsMetadata } = await import('@/lib/googleDriveCards');

                            // 🔍 衝突檢測：檢查雲端是否被其他裝置修改過
                            const { lastModified: cloudLastModified, cards: cloudCards } = await loadCardsMetadata();
                            const lastSyncedCloudTime = get().lastSyncedCloudTime;

                            // 比較雲端當前時間 vs 上次同步時的雲端時間
                            if (cloudLastModified && lastSyncedCloudTime) {
                                const cloudTime = new Date(cloudLastModified).getTime();
                                const lastSyncedTime = new Date(lastSyncedCloudTime).getTime();

                                // 如果雲端時間戳改變了，表示有其他裝置修改過
                                if (cloudTime !== lastSyncedTime) {
                                    console.warn('[CardSync] ⚠️ 偵測到其他裝置已修改雲端資料，停止同步');
                                    set({
                                        isSyncing: false,
                                        syncConflict: {
                                            cloudData: {
                                                cards: cloudCards,
                                                cardContents: {}, // 暫時不載入內容
                                                lastModified: cloudLastModified
                                            },
                                            localLastModified: get().lastModified
                                        }
                                    });
                                    return;
                                }
                            }

                            let metadataSynced = false;
                            const contentSyncedIds = [];

                            // 1. 同步 metadata
                            if (metadataDirty) {
                                console.log('[CardSync] 同步元資料...');
                                const success = await saveCardsMetadata(cards);
                                if (success) {
                                    metadataSynced = true;
                                    console.log('[CardSync] ✅ 元資料同步成功');
                                } else {
                                    console.error('[CardSync] ❌ 元資料同步失敗');
                                }
                            }

                            // 2. 同步 contents
                            if (contentDirtyIds.length > 0) {
                                console.log(`[CardSync] 同步 ${contentDirtyIds.length} 個內容案...`);

                                const results = await Promise.allSettled(
                                    contentDirtyIds.map(async (cardId) => {
                                        const content = cardContents[cardId];
                                        if (content === undefined) return false;

                                        const success = await saveCardContent(cardId, content);
                                        if (success) return cardId;
                                        throw new Error('Save failed');
                                    })
                                );

                                results.forEach((result) => {
                                    if (result.status === 'fulfilled' && result.value) {
                                        contentSyncedIds.push(result.value);
                                    }
                                });

                                console.log(`[CardSync] ✅ ${contentSyncedIds.length}/${contentDirtyIds.length} 個內容同步成功`);
                            }

                            // 3. 清除 Dirty Flags
                            get().clearDirtyFlags(metadataSynced, contentSyncedIds);

                            // 4. 更新上次同步的雲端時間戳（使用當前時間，因為我們剛上傳）
                            if (metadataSynced || contentSyncedIds.length > 0) {
                                set({ lastSyncedCloudTime: new Date().toISOString() });
                            }

                            console.log('[CardSync] 🎉 差異同步完成');
                        } catch (error) {
                            console.error('[CardSync] ❌ 同步失敗:', error.message || error);
                        } finally {
                            set({ isSyncing: false });
                            console.log('[CardSync] === 同步結束 ===\n');
                        }
                    }, 2000);
                };
            })(),

            // 從雲端載入所有資料
            loadFromCloud: async () => {
                set({ isLoading: true });
                try {
                    const { fullLoad } = await import('@/lib/googleDriveCards');
                    const { cards, cardContents, lastModified: cloudLastModified } = await fullLoad();

                    const { unsavedChanges, lastModified: localLastModified } = get();
                    const hasUnsavedChanges = unsavedChanges.metadata || unsavedChanges.contents.size > 0;

                    // 衝突檢測：只要本地有未儲存變更，就需要詢問使用者
                    if (hasUnsavedChanges) {
                        // 情況1: 雲端有資料，本地也有未儲存變更
                        if (Object.keys(cards).length > 0) {
                            set({ isLoading: false });
                            return {
                                conflict: true,
                                cloudData: { cards, cardContents, lastModified: cloudLastModified },
                                localLastModified: localLastModified || new Date().toISOString()
                            };
                        }

                        // 情況2: 雲端無資料，但本地有新建的卡片
                        // 這種情況下，應該直接上傳，不需要詢問
                        console.log('[CardStore] 雲端無資料，本地有變更，將在下次同步時上傳');
                    }

                    // 無衝突，直接載入
                    if (Object.keys(cards).length > 0) {
                        const validatedCards = validateCards(cards);

                        set({
                            cards: validatedCards,
                            cardContents: cardContents || {},
                            lastModified: cloudLastModified,
                            lastSyncedCloudTime: cloudLastModified, // 記錄雲端時間戳
                            isLoading: false
                        });

                        // 同時儲存到 localStorage
                        Object.entries(cardContents || {}).forEach(([cardId, content]) => {
                            if (content !== undefined) {
                                localStorage.setItem(`card-content-${cardId}`, content);
                            }
                        });

                        console.log('[CardStore] 雲端資料已載入:', Object.keys(validatedCards).length, '張卡片');
                        return { success: true };
                    }

                    console.log('[CardStore] 雲端無資料');
                    set({ isLoading: false });
                    return { success: false };
                } catch (error) {
                    console.log('[CardStore] 載入雲端資料失敗:', error.message || error);
                    set({ isLoading: false });
                    return { success: false, error: error.message };
                }
            },

            // 強制從雲端載入（解決衝突時使用）
            forceLoadFromCloud: async (cloudData) => {
                try {
                    const { cards, cardContents, lastModified } = cloudData;
                    const validatedCards = validateCards(cards);

                    set({
                        cards: validatedCards,
                        cardContents: cardContents || {},
                        lastModified,
                        lastSyncedCloudTime: lastModified, // 記錄雲端時間戳
                        unsavedChanges: { metadata: false, contents: new Set() }
                    });

                    Object.entries(cardContents || {}).forEach(([cardId, content]) => {
                        if (content !== undefined) {
                            localStorage.setItem(`card-content-${cardId}`, content);
                        }
                    });

                    console.log('[CardStore] 已從雲端強制載入');
                    return true;
                } catch (error) {
                    console.error('[CardStore] 強制載入失敗:', error);
                    return false;
                }
            },

            // 強制同步到雲端（解決衝突時使用）
            forceUploadToCloud: async () => {
                try {
                    // 直接觸發同步，忽略 debounce
                    const { cards, cardContents } = get();
                    const { saveCardsMetadata, saveCardContent } = await import('@/lib/googleDriveCards');

                    await saveCardsMetadata(cards);

                    const contentIds = Object.keys(cardContents);
                    await Promise.all(
                        contentIds.map(cardId => saveCardContent(cardId, cardContents[cardId]))
                    );

                    set({
                        unsavedChanges: { metadata: false, contents: new Set() }
                    });

                    console.log('[CardStore] 已強制上傳到雲端');
                    return true;
                } catch (error) {
                    console.error('[CardStore] 強制上傳失敗:', error);
                    return false;
                }
            },

            // ===== 工具函數 =====

            // 取得所有連線（用於 ReactFlow edges）
            getEdges: () => {
                const { cards, showHiddenLinks } = get();
                const edges = [];

                Object.values(cards).forEach(card => {
                    card.links?.forEach((link, index) => {
                        // 過濾隱藏連線
                        if (link.isHidden && !showHiddenLinks) return;

                        edges.push({
                            id: `${card.id}-${link.targetId}-${index}`,
                            source: card.id,
                            target: link.targetId,
                            type: 'smoothstep',
                            animated: true,
                            label: link.label,
                            style: {
                                stroke: link.isHidden ? '#94a3b880' : '#94a3b8',
                                strokeWidth: link.isHidden ? 1 : 2,
                                strokeDasharray: link.isHidden ? '5,5' : '0'
                            }
                        });
                    });
                });

                return edges;
            },

            // 取得所有節點（用於 ReactFlow nodes）
            getNodes: () => {
                const { cards } = get();
                return Object.values(cards).map(card => ({
                    id: card.id,
                    type: 'cardNode',
                    data: {
                        title: card.title,
                        summary: card.summary,
                        tags: card.tags,
                        color: card.color,
                        linkCount: card?.links?.length || 0
                    },
                    position: {
                        x: card.position?.x || 0,
                        y: card.position?.y || 0
                        // z 座標在 2D 模式不使用
                    }
                }));
            },

            // 更新節點位置（拖曳後）
            updateNodePosition: (cardId, position) => {
                const card = get().cards[cardId];
                if (!card) return;

                set(state => ({
                    cards: {
                        ...state.cards,
                        [cardId]: {
                            ...state.cards[cardId],
                            position: {
                                ...state.cards[cardId].position,
                                ...position
                            }
                        }
                    }
                }));
            },

            // 取得卡片統計
            getStats: () => {
                const { cards } = get();
                const cardArray = Object.values(cards);

                return {
                    totalCards: cardArray.length,
                    totalLinks: cardArray.reduce((sum, card) => sum + (card.links?.length || 0), 0),
                    tags: [...new Set(cardArray.flatMap(card => card.tags || []))],
                    avgLinksPerCard: cardArray.length > 0
                        ? (cardArray.reduce((sum, card) => sum + (card.links?.length || 0), 0) / cardArray.length).toFixed(1)
                        : 0
                };
            }
        }),
        {
            name: 'card-storage',
            partialize: (state) => ({
                // 只持久化卡片元資料，不持久化完整內容
                cards: state.cards,
                viewMode: state.viewMode,
                showHiddenLinks: state.showHiddenLinks,
                // 持久化同步狀態，確保重新整理後仍能檢測衝突
                lastModified: state.lastModified,
                lastSyncedCloudTime: state.lastSyncedCloudTime,
                unsavedChanges: {
                    metadata: state.unsavedChanges.metadata,
                    contents: Array.from(state.unsavedChanges.contents) // Set 轉 Array
                }
            }),
            // 反序列化時將 Array 轉回 Set
            merge: (persistedState, currentState) => ({
                ...currentState,
                ...persistedState,
                unsavedChanges: {
                    metadata: persistedState.unsavedChanges?.metadata || false,
                    contents: new Set(persistedState.unsavedChanges?.contents || [])
                }
            })
        }
    )
);
