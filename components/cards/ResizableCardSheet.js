'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, GripVertical, Tag as TagIcon, Plus, Pin, PinOff } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import MarkdownRenderer from './MarkdownRenderer';
import ContentContextMenu from './ContentContextMenu';
import CardDrawer from './CardDrawer';

/**
 * 可調整大小的卡片 Sheet，支持多 Tab
 * - 預設寬度 50%，可拖拉調整
 * - 支持多個 Tab（類似瀏覽器分頁）
 * - 點擊左側卡片時，卡片會自動居中
 * - 支持釘選功能：釘選時點擊背景不會關閉
 */
const ResizableCardSheet = ({ open, onClose, onCardFocus }) => {
    const [width, setWidth] = useState(75); // 百分比
    const [isDragging, setIsDragging] = useState(false);
    const [openTabs, setOpenTabs] = useState([]); // [cardId1, cardId2, ...]
    const [activeTab, setActiveTab] = useState(null);
    const [isPinned, setIsPinned] = useState(false); // 釘選狀態
    const sheetRef = useRef(null);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(0);

    // 從 store 獲取數據
    const selectedCardId = useCardStore(state => state.selectedCardId);
    const cards = useCardStore(state => state.cards);
    const cardContents = useCardStore(state => state.cardContents);
    const loadCardContent = useCardStore(state => state.loadCardContent);
    const updateCard = useCardStore(state => state.updateCard);
    const updateCardContent = useCardStore(state => state.updateCardContent);
    const deleteCard = useCardStore(state => state.deleteCard);
    const addLink = useCardStore(state => state.addLink);

    // 追蹤上一次聚焦的卡片 ID，避免重複聚焦
    const lastFocusedCardRef = useRef(null);

    // 當有新卡片被選中時，添加到 tabs
    useEffect(() => {
        if (selectedCardId && open) {
            const isNewCard = !openTabs.includes(selectedCardId);
            const shouldFocus = lastFocusedCardRef.current !== selectedCardId;

            setOpenTabs(prev => {
                if (prev.includes(selectedCardId)) {
                    setActiveTab(selectedCardId);
                    return prev;
                }
                const newTabs = [...prev, selectedCardId];
                setActiveTab(selectedCardId);
                return newTabs;
            });

            // 載入卡片內容
            loadCardContent(selectedCardId);

            // 只在真正需要時聚焦（新卡片或切換到不同卡片）
            if (shouldFocus) {
                // 通知父組件聚焦到這張卡片，並傳遞當前 Sheet 寬度
                onCardFocus?.(selectedCardId, width);
                lastFocusedCardRef.current = selectedCardId;
            }
        }
    }, [selectedCardId, open, onCardFocus, loadCardContent]);

    // 開始拖拽
    const handleDragStart = useCallback((e) => {
        setIsDragging(true);
        dragStartX.current = e.clientX;
        dragStartWidth.current = width;
        e.preventDefault();
    }, [width]);

    // 拖拽中
    const handleDragMove = useCallback((e) => {
        if (!isDragging) return;

        const deltaX = dragStartX.current - e.clientX;
        const viewportWidth = window.innerWidth;
        const deltaPercent = (deltaX / viewportWidth) * 100;
        const newWidth = Math.min(Math.max(dragStartWidth.current + deltaPercent, 30), 80);

        setWidth(newWidth);
    }, [isDragging]);

    // 結束拖拽
    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 監聽拖拽事件
    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleDragMove);
            document.addEventListener('mouseup', handleDragEnd);
            return () => {
                document.removeEventListener('mousemove', handleDragMove);
                document.removeEventListener('mouseup', handleDragEnd);
            };
        }
    }, [isDragging, handleDragMove, handleDragEnd]);

    // 關閉整個 Sheet
    const handleCloseSheet = useCallback(() => {
        setOpenTabs([]);
        setActiveTab(null);
        lastFocusedCardRef.current = null; // 重置聚焦記錄
        useCardStore.setState({ selectedCardId: null });
        onClose?.();
    }, [onClose]);

    // 關閉特定 tab
    const closeTab = useCallback((cardId, e) => {
        e?.stopPropagation();

        // 這裡不需要使用 prev，因為 openTabs 是依賴項
        // 如果想避免依賴 openTabs，可以使用函數式更新但不要在裡面執行副作用
        // 考慮到邏輯複雜性，直接讀取當前狀態比較清晰

        const newTabs = openTabs.filter(id => id !== cardId);
        setOpenTabs(newTabs);

        if (activeTab === cardId) {
            const currentIndex = openTabs.indexOf(cardId);
            // 優先選擇左邊的 tab，如果沒有則選擇剩下的第一個
            const newActiveTab = newTabs[currentIndex - 1] || newTabs[0] || null;
            setActiveTab(newActiveTab);

            if (!newActiveTab) {
                // 如果沒有活動 tab 了，關閉 Sheet
                handleCloseSheet(); // 使用封裝好的關閉函數
            } else {
                // 如果還有 tab，切換選中狀態（這會觸發聚焦）
                useCardStore.setState({ selectedCardId: newActiveTab });

                // 這裡可能需要手動觸發聚焦，雖然 useEffect 會監聽到 selectedCardId 變化
                // 但為了保險起見，可以更新 ref
                lastFocusedCardRef.current = newActiveTab;
            }
        }
    }, [activeTab, openTabs, handleCloseSheet]);

    // 切換 tab
    const switchTab = useCallback((cardId) => {
        setActiveTab(cardId);
        onCardFocus?.(cardId, width);
        lastFocusedCardRef.current = cardId; // 更新聚焦記錄
        useCardStore.setState({ selectedCardId: cardId });
    }, [onCardFocus, width]);



    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // ... (existing code for drag handlers) ...

    if (!open || openTabs.length === 0) return null;

    return (
        <>
            {/* 遮罩層 - 只在未釘選時顯示 */}
            {!isPinned && (
                <div
                    className="fixed inset-0 bg-black/20 z-40"
                    onClick={() => {
                        handleCloseSheet();
                    }}
                />
            )}


            {/* Sheet 主體 */}
            <div
                ref={sheetRef}
                className="fixed top-0 right-0 h-screen bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                style={{ width: isMobile ? '100%' : `${width}%` }}
            >
                {/* 拖拽手柄 - 手機版不顯示 */}
                {!isMobile && (
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-border hover:bg-primary cursor-col-resize transition-all group z-10"
                        onMouseDown={handleDragStart}
                    >
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="w-4 h-4 text-primary" />
                        </div>
                    </div>
                )}

                {/* Tab 欄 - 在最上方 */}
                <div className="flex items-center border-b border-border bg-muted/30 overflow-x-auto flex-shrink-0">
                    <div className="flex-1 flex items-center overflow-x-auto">
                        {openTabs.map((cardId) => {
                            const card = cards[cardId];
                            if (!card) return null;

                            const isActive = activeTab === cardId;

                            return (
                                <div
                                    key={cardId}
                                    className={`
                                        group relative flex items-center gap-2 px-4 py-3 min-w-[150px] max-w-[200px]
                                        border-r border-border cursor-pointer transition-colors
                                        ${isActive
                                            ? 'bg-background text-foreground'
                                            : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                        }
                                    `}
                                    onClick={() => switchTab(cardId)}
                                >
                                    <span className="flex-1 truncate text-sm font-medium">
                                        {card.title}
                                    </span>
                                    <button
                                        onClick={(e) => closeTab(cardId, e)}
                                        className="opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 rounded p-0.5 transition-opacity"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {/* 釘選按鈕 */}
                    <button
                        onClick={() => setIsPinned(!isPinned)}
                        className={`flex-shrink-0 p-3 hover:bg-muted transition-colors border-l border-border ${isPinned ? 'bg-muted text-primary' : ''
                            }`}
                        title={isPinned ? '取消釘選' : '釘選面板'}
                    >
                        {isPinned ? <Pin className="w-5 h-5" /> : <PinOff className="w-5 h-5" />}
                    </button>

                    {/* 關閉整個 Sheet 按鈕 */}
                    <button
                        onClick={handleCloseSheet}
                        className="flex-shrink-0 p-3 hover:bg-muted transition-colors border-l border-border"
                        title="關閉面板"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Tab 內容區域 */}
                <div className="flex-1 overflow-hidden">
                    {openTabs.map((cardId) => (
                        <div
                            key={cardId}
                            className={`h-full ${activeTab === cardId ? 'block' : 'hidden'}`}
                        >
                            <CardEditor cardId={cardId} />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

/**
 * 單個卡片的編輯器組件 - Notion 風格
 */
const CardEditor = ({ cardId }) => {
    const card = useCardStore(state => state.cards[cardId]);
    const content = useCardStore(state => state.cardContents[cardId]);
    const cards = useCardStore(state => state.cards);
    const updateCard = useCardStore(state => state.updateCard);
    const updateCardContent = useCardStore(state => state.updateCardContent);
    const addLink = useCardStore(state => state.addLink);

    const [editContent, setEditContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [newTagInput, setNewTagInput] = useState('');
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
    const [showTagInput, setShowTagInput] = useState(false);

    const contentTextareaRef = useRef(null);

    // 初始化內容：確保第一行是 H1 標題
    useEffect(() => {
        if (content !== undefined) {
            const lines = content.split('\n');
            const firstLine = lines[0] || '';

            // 如果第一行不是 H1，自動添加
            if (!firstLine.startsWith('# ')) {
                const titleLine = `# ${card?.title || '未命名'}`;
                const restContent = content || '';
                setEditContent(restContent ? `${titleLine}\n\n${restContent}` : titleLine);
            } else {
                setEditContent(content);
            }
        } else if (card) {
            // 新卡片，初始化為 H1 標題
            setEditContent(`# ${card.title || '未命名'}`);
        }
    }, [card, content]);

    if (!card) return null;

    // 儲存內容並自動提取標題
    const saveContent = () => {
        if (isContextMenuOpen) return;

        const lines = editContent.split('\n');
        const firstLine = lines[0] || '';

        // 提取第一行的 H1 作為標題
        if (firstLine.startsWith('# ')) {
            const newTitle = firstLine.substring(2).trim();
            if (newTitle && newTitle !== card.title) {
                updateCard(cardId, { title: newTitle });
            }
        }

        // 儲存完整內容（包含 H1）
        if (editContent !== content) {
            updateCardContent(cardId, editContent);
        }

        setIsEditing(false);
    };

    // 處理內容變更
    const handleContentChange = (e) => {
        const newContent = e.target.value;
        const lines = newContent.split('\n');
        const firstLine = lines[0] || '';

        // 確保第一行始終是 H1
        if (lines.length > 0 && !firstLine.startsWith('# ')) {
            // 如果用戶刪除了 #，自動補回
            if (firstLine.length > 0) {
                const correctedContent = `# ${firstLine}\n${lines.slice(1).join('\n')}`;
                setEditContent(correctedContent);
                return;
            }
        }

        setEditContent(newContent);
    };

    const addTag = () => {
        const trimmedTag = newTagInput.trim();
        if (trimmedTag && !(card.tags || []).includes(trimmedTag)) {
            const newTags = [...(card.tags || []), trimmedTag];
            updateCard(cardId, { tags: newTags });
            setNewTagInput('');
            setShowTagInput(false);
        }
    };

    const removeTag = (tagToRemove) => {
        const newTags = (card.tags || []).filter(tag => tag !== tagToRemove);
        updateCard(cardId, { tags: newTags });
    };

    const handleInsertLink = (linkText) => {
        if (contentTextareaRef.current) {
            const textarea = contentTextareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = editContent.substring(0, start) + linkText + editContent.substring(end);
            setEditContent(newContent);

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + linkText.length, start + linkText.length);
            }, 0);
        } else {
            setEditContent(prev => prev + '\n' + linkText);
            setIsEditing(true);
        }
    };

    const handleCreateCardFromSelection = (start, end, linkText, newCardId) => {
        const newContent = editContent.substring(0, start) + linkText + editContent.substring(end);
        setEditContent(newContent);

        addLink(cardId, newCardId, {
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target'
        });

        useCardStore.setState({ selectedCardId: newCardId });
    };

    const handleCardLinkClick = (linkedCardId) => {
        useCardStore.setState({ selectedCardId: linkedCardId });
    };

    const handleSetSummary = (text) => {
        let cleanText = text.replace(/\[\[card:[^|\]]+\|([^\]]+)\]\]/g, '$1');
        cleanText = cleanText.replace(/\[\[card:[^\]]+\]\]/g, '');

        const newSummary = cleanText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        updateCard(cardId, { summary: newSummary });
    };

    const handleClearSummary = () => {
        updateCard(cardId, { summary: [] });
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* 主要內容區域 - 佔據整個空間 */}
            <div className="flex-1 overflow-y-auto">
                {isEditing ? (
                    <div className="h-full flex flex-col">
                        {/* 編輯模式頂部工具列 */}
                        <div className="flex-shrink-0 sticky top-0 bg-background/95 backdrop-blur border-b border-border px-6 py-2 flex items-center justify-between z-10">
                            <div className="text-sm text-muted-foreground">
                                編輯模式
                            </div>
                            <button
                                onClick={saveContent}
                                className="px-4 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                <span>✓ 完成編輯</span>
                                <span className="text-xs opacity-70">(Esc)</span>
                            </button>
                        </div>

                        {/* 編輯區域 */}
                        <ContentContextMenu
                            currentCardId={cardId}
                            onInsertLink={handleInsertLink}
                            onOpenChange={setIsContextMenuOpen}
                            onCreateCardFromSelection={handleCreateCardFromSelection}
                            textareaRef={contentTextareaRef}
                            onSetSummary={handleSetSummary}
                            onClearSummary={handleClearSummary}
                            hasSummary={card.summary && card.summary.length > 0}
                        >
                            <textarea
                                ref={contentTextareaRef}
                                value={editContent}
                                onChange={handleContentChange}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        e.preventDefault();
                                        saveContent();
                                    }
                                }}
                                className="w-full flex-1 p-8 bg-transparent focus:outline-none font-mono text-sm resize-none"
                                placeholder="# 標題&#10;&#10;在此輸入內容...&#10;&#10;💡 提示：&#10;- 按 Esc 或點擊「完成編輯」退出編輯模式&#10;- 第一行必須是 # 標題格式&#10;- 支援 Markdown 語法&#10;- 右鍵可插入卡片連結"
                                autoFocus
                                style={{ whiteSpace: 'pre-wrap' }}
                            />
                        </ContentContextMenu>
                    </div>
                ) : (
                    <div
                        className="p-8 min-h-full cursor-text hover:bg-muted/5 transition-colors relative group"
                        onDoubleClick={() => setIsEditing(true)}
                        style={{ whiteSpace: 'pre-wrap' }}
                    >
                        {/* 雙擊提示 */}
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="px-3 py-1.5 bg-muted/80 backdrop-blur rounded-md text-xs text-muted-foreground">
                                雙擊編輯
                            </div>
                        </div>

                        {content ? (
                            <MarkdownRenderer
                                content={content}
                                onCardClick={handleCardLinkClick}
                            />
                        ) : (
                            <div className="text-muted-foreground">
                                <h1 className="text-3xl font-bold mb-4">{card.title}</h1>
                                <p className="text-sm">雙擊此處開始編輯...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 底部工具列：Tags + 連結資訊 */}
            <div className="flex-shrink-0 border-t border-border bg-background/95 backdrop-blur">
                {/* Tags 區域 */}
                <div className="px-6 py-3 border-b border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                        <TagIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {card.tags && card.tags.map((tag, index) => (
                            <span
                                key={index}
                                className="group/tag px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1 transition-colors"
                            >
                                {tag}
                                <button
                                    onClick={() => removeTag(tag)}
                                    className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                        {showTagInput ? (
                            <div className="flex items-center gap-1">
                                <input
                                    type="text"
                                    value={newTagInput}
                                    onChange={(e) => setNewTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        } else if (e.key === 'Escape') {
                                            setShowTagInput(false);
                                            setNewTagInput('');
                                        }
                                    }}
                                    onBlur={() => {
                                        if (!newTagInput.trim()) {
                                            setShowTagInput(false);
                                        }
                                    }}
                                    placeholder="標籤名稱..."
                                    className="w-24 px-2 py-1 text-xs bg-transparent border border-primary rounded-full outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={addTag}
                                    className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                                >
                                    <Plus className="w-3 h-3 text-primary" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowTagInput(true)}
                                className="px-3 py-1 text-xs text-muted-foreground hover:text-primary border border-dashed border-muted-foreground/30 hover:border-primary rounded-full transition-colors"
                            >
                                + 新增標籤
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResizableCardSheet;
