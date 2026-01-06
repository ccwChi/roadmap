'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, GripVertical, Tag as TagIcon, Plus, Link2, Trash2, Pin, PinOff } from 'lucide-react';
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
    const [width, setWidth] = useState(50); // 百分比
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
                style={{ width: `${width}%` }}
            >
                {/* 拖拽手柄 */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 hover:w-2 bg-border hover:bg-primary cursor-col-resize transition-all group z-10"
                    onMouseDown={handleDragStart}
                >
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="w-4 h-4 text-primary" />
                    </div>
                </div>

                {/* Tab 欄 */}
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
 * 單個卡片的編輯器組件
 */
const CardEditor = ({ cardId }) => {
    const card = useCardStore(state => state.cards[cardId]);
    const content = useCardStore(state => state.cardContents[cardId]);
    const cards = useCardStore(state => state.cards);
    const updateCard = useCardStore(state => state.updateCard);
    const updateCardContent = useCardStore(state => state.updateCardContent);
    const deleteCard = useCardStore(state => state.deleteCard);
    const addLink = useCardStore(state => state.addLink);

    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');

    const [newTagInput, setNewTagInput] = useState('');
    const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);


    const contentTextareaRef = useRef(null);

    useEffect(() => {
        if (card) {
            setEditTitle(card.title);
        }
        if (content !== undefined) {
            setEditContent(content);
        }
    }, [card, content]);

    if (!card) return null;

    const saveTitle = () => {
        if (editTitle.trim() !== card.title) {
            updateCard(cardId, { title: editTitle });
        }
        setIsEditingTitle(false);
    };

    const saveContent = () => {
        if (isContextMenuOpen) return;
        if (editContent !== content) {
            updateCardContent(cardId, editContent);
        }
        setIsEditingContent(false);
    };



    const addTag = () => {
        const trimmedTag = newTagInput.trim();
        if (trimmedTag && !(card.tags || []).includes(trimmedTag)) {
            const newTags = [...(card.tags || []), trimmedTag];
            updateCard(cardId, { tags: newTags });
            setNewTagInput('');
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
            setIsEditingContent(true);
        }
    };

    const handleCreateCardFromSelection = (start, end, linkText, newCardId) => {
        const newContent = editContent.substring(0, start) + linkText + editContent.substring(end);
        setEditContent(newContent);

        // 自動建立連結：當前卡片 -> 新卡片
        addLink(cardId, newCardId, {
            sourceHandle: 'bottom-source',
            targetHandle: 'top-target'
        });

        // 直接在 Sheet 中切換到新卡片（添加新 tab）
        // 這裡應該會自動聚焦，因為 selectedCardId 改變了
        useCardStore.setState({ selectedCardId: newCardId });
    };

    const handleCardLinkClick = (linkedCardId) => {
        // 直接切換到該卡片（會添加新 tab）
        useCardStore.setState({ selectedCardId: linkedCardId });
    };

    const handleSetSummary = (text) => {
        // 清理卡片連結語法
        // 1. 將 [[card:id|顯示文字]] 替換為 顯示文字
        let cleanText = text.replace(/\[\[card:[^|\]]+\|([^\]]+)\]\]/g, '$1');
        // 2. 將 [[card:id]] 移除（因為在摘要中顯示 ID 無意義）
        cleanText = cleanText.replace(/\[\[card:[^\]]+\]\]/g, '');

        // 將選取的文字分割成陣列（按換行符）
        const newSummary = cleanText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        updateCard(cardId, { summary: newSummary });
    };

    const handleClearSummary = () => {
        updateCard(cardId, { summary: [] });
    };

    // 取得連結到的卡片
    const linkedCards = card.links
        .filter(link => !link.isHidden)
        .map(link => cards[link.targetId])
        .filter(Boolean);

    // 取得被連結的卡片
    const backlinks = Object.values(cards).filter(c =>
        c.links.some(link => link.targetId === cardId)
    );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 p-6 border-b border-border">
                {/* 標題 */}
                <div className="mb-4">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onBlur={saveTitle}
                            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                            className="w-full text-2xl font-bold bg-transparent focus:border-primary outline-none px-1 py-2"
                            placeholder="卡片標題"
                            autoFocus
                        />
                    ) : (
                        <h2
                            className="text-2xl font-bold cursor-text hover:border-primary/50 px-1 py-2 transition-colors"
                            onClick={() => setIsEditingTitle(true)}
                        >
                            {card.title}
                        </h2>
                    )}
                </div>

                {/* Tags */}
                <div className="flex items-center gap-2 flex-wrap">
                    <TagIcon className="w-4 h-4 text-muted-foreground" />
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
                    <div className="flex items-center gap-1">
                        <input
                            type="text"
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="新增標籤..."
                            className="w-24 px-2 py-1 text-xs bg-transparent border border-dashed border-muted-foreground/30 hover:border-primary/50 focus:border-primary rounded-full outline-none transition-colors"
                        />
                        {newTagInput.trim() && (
                            <button
                                onClick={addTag}
                                className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                            >
                                <Plus className="w-3 h-3 text-primary" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 內容區域 */}
                <div className="space-y-2 flex-1 flex flex-col min-h-0">
                    <h3 className="text-sm font-medium text-muted-foreground">內容</h3>
                    {isEditingContent ? (
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
                                onChange={(e) => setEditContent(e.target.value)}
                                onBlur={saveContent}
                                className="w-full flex-1 min-h-[300px] p-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl outline-none font-mono text-sm resize-none transition-colors"
                                placeholder="支援 Markdown 格式&#10;&#10;右鍵可插入卡片連結或從選取建立新卡片"
                                autoFocus
                            />
                        </ContentContextMenu>
                    ) : (
                        <div
                            className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl min-h-[200px] cursor-text transition-all"
                            onClick={() => setIsEditingContent(true)}
                        >
                            {content ? (
                                <MarkdownRenderer
                                    content={content}
                                    onCardClick={handleCardLinkClick}
                                />
                            ) : (
                                <p className="text-muted-foreground text-sm">點擊此處開始編輯內容...</p>
                            )}
                        </div>
                    )}
                </div>


                {/* 連結資訊 */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    {/* 連結到 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Link2 className="w-4 h-4" />
                            <span>連結到 ({linkedCards.length})</span>
                        </div>
                        {linkedCards.length > 0 ? (
                            <div className="space-y-1">
                                {linkedCards.map(linkedCard => (
                                    <button
                                        key={linkedCard.id}
                                        onClick={() => useCardStore.setState({ selectedCardId: linkedCard.id })}
                                        className="block w-full text-left px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                                    >
                                        {linkedCard.title}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">無連結</p>
                        )}
                    </div>

                    {/* 被連結 */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Link2 className="w-4 h-4 rotate-180" />
                            <span>被連結 ({backlinks.length})</span>
                        </div>
                        {backlinks.length > 0 ? (
                            <div className="space-y-1">
                                {backlinks.map(backlinkCard => (
                                    <button
                                        key={backlinkCard.id}
                                        onClick={() => useCardStore.setState({ selectedCardId: backlinkCard.id })}
                                        className="block w-full text-left px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                                    >
                                        {backlinkCard.title}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">無反向連結</p>
                        )}
                    </div>
                </div>
            </div >


        </div >
    );
};

export default ResizableCardSheet;
