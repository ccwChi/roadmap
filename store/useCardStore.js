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
            showHiddenLinks: false,           // 是否顯示隱藏連線
            toggleHiddenLinks: () => set(state => ({
                showHiddenLinks: !state.showHiddenLinks
            })),

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

                // 觸發雲端同步
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

            // ===== 雲端同步 =====
            syncToCloud: (() => {
                let timeout = null;
                return () => {
                    if (timeout) clearTimeout(timeout);
                    timeout = setTimeout(async () => {
                        console.log('[CardSync] === 開始卡片同步 ===');

                        // 檢查是否已登入 Google
                        try {
                            const { useStore } = await import('@/store/useStore');
                            const isSignedIn = useStore.getState().isSignedIn;

                            console.log('[CardSync] 1. 登入狀態:', isSignedIn);
                            if (!isSignedIn) {
                                console.log('[CardSync] ❌ 未登入，跳過雲端同步');
                                return;
                            }
                        } catch (error) {
                            console.log('[CardSync] ❌ 無法檢查登入狀態，跳過同步');
                            return;
                        }

                        const { cards, cardContents } = get();
                        console.log('[CardSync] 2. 準備同步:', {
                            卡片數量: Object.keys(cards).length,
                            內容數量: Object.keys(cardContents).length
                        });

                        try {
                            // 等待 Google API 就緒
                            const { waitForGoogleApiReady } = await import('@/lib/googleDrive');
                            await waitForGoogleApiReady(5000);

                            const { saveCardsMetadata, saveCardContent } = await import('@/lib/googleDriveCards');

                            // 1. 同步元資料
                            console.log('[CardSync] 3. 同步元資料...');
                            const metadataSuccess = await saveCardsMetadata(cards);

                            if (!metadataSuccess) {
                                throw new Error('元資料同步失敗');
                            }
                            console.log('[CardSync] ✅ 元資料同步成功');

                            // 2. 同步已載入的內容
                            console.log('[CardSync] 4. 同步內容...');
                            const contentResults = await Promise.allSettled(
                                Object.entries(cardContents).map(([cardId, content]) =>
                                    saveCardContent(cardId, content)
                                )
                            );

                            const failedCount = contentResults.filter(r => r.status === 'rejected' || !r.value).length;

                            if (failedCount > 0) {
                                console.warn(`[CardSync] ⚠️ ${failedCount} 個內容同步失敗`);
                            } else {
                                console.log('[CardSync] ✅ 所有內容同步成功');
                            }

                            console.log('[CardSync] 🎉 雲端同步流程完成');
                        } catch (error) {
                            console.error('[CardSync] ❌ 雲端同步失敗:', error.message || error);
                        } finally {
                            console.log('[CardSync] === 卡片同步結束 ===\n');
                        }
                    }, 2000); // 增加 debounce 時間，避免頻繁觸發
                };
            })(),

            // 從雲端載入所有資料
            loadFromCloud: async () => {
                try {
                    const { fullLoad } = await import('@/lib/googleDriveCards');
                    const { cards, cardContents } = await fullLoad();

                    if (Object.keys(cards).length > 0) {
                        // 驗證並修復載入的資料
                        const validatedCards = validateCards(cards);

                        set({
                            cards: validatedCards,
                            cardContents: cardContents || {}
                        });

                        // 同時儲存到 localStorage
                        Object.entries(cardContents || {}).forEach(([cardId, content]) => {
                            if (content !== undefined) {
                                localStorage.setItem(`card-content-${cardId}`, content);
                            }
                        });

                        console.log('[CardStore] 雲端資料已載入:', Object.keys(validatedCards).length, '張卡片');
                        return true;
                    }

                    console.log('[CardStore] 雲端無資料');
                    return false;
                } catch (error) {
                    console.log('[CardStore] 載入雲端資料失敗:', error.message || error);
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
                showHiddenLinks: state.showHiddenLinks
            })
        }
    )
);
