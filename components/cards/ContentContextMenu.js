'use client';

import { useState } from 'react';
import { Link2, Search, ExternalLink, FileText, Scissors } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useCardStore } from '@/store/useCardStore';

/**
 * 內容編輯區的右鍵選單組件
 * 提供插入連結和建立新卡片的功能
 */
const ContentContextMenu = ({
    children,
    onInsertLink,
    onCreateCardFromSelection,
    currentCardId,
    onOpenChange,
    textareaRef
}) => {
    const cards = useCardStore(state => state.cards);
    const addCard = useCardStore(state => state.addCard);
    const [showLinkDialog, setShowLinkDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // 過濾掉當前卡片，並根據搜索排序
    const availableCards = Object.values(cards)
        .filter(card => card.id !== currentCardId)
        .filter(card =>
            searchQuery === '' ||
            card.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 10);

    const handleInsertLink = (targetCard) => {
        // 檢查是否有選取文字
        let displayText = targetCard.title; // 預設使用卡片標題

        if (textareaRef?.current) {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = textarea.value.substring(start, end);

            // 如果有選取文字，使用選取的文字作為顯示文字
            if (selectedText.trim()) {
                displayText = selectedText.trim();
            }
        }

        // 使用新格式：[[card:id|顯示文字]]
        // 如果顯示文字與卡片標題相同，使用簡短格式 [[card:id]]
        const linkText = displayText === targetCard.title
            ? `[[card:${targetCard.id}]]`
            : `[[card:${targetCard.id}|${displayText}]]`;

        onInsertLink(linkText);
        setShowLinkDialog(false);
        setSearchQuery('');
    };

    // 從選取內容建立新卡片
    const handleCreateCardFromSelection = () => {
        if (!textareaRef?.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        if (!selectedText.trim()) return;

        // 解析選取的文字：第一行作為標題，其餘作為內容
        const lines = selectedText.trim().split('\n');
        const title = lines[0].replace(/^#+\s*/, '').trim(); // 移除 markdown 標題符號
        const content = lines.slice(1).join('\n').trim();

        // 建立新卡片
        const newCardId = `card-${Date.now()}`;

        // 計算新卡片位置：放在當前卡片下方
        const currentCard = cards[currentCardId];
        let newPosition = { x: Math.random() * 400, y: Math.random() * 400, z: 0 };

        if (currentCard && currentCard.position) {
            // 獲取當前卡片的位置
            const currentX = currentCard.position.x || 0;
            const currentY = currentCard.position.y || 0;

            // 卡片的預設高度約為 200-250 像素（根據內容可能更高）
            // 這裡使用 280 作為安全值（包含 padding 和 margin）
            const cardHeight = 280;
            const offset = 20; // 間距

            newPosition = {
                x: currentX,
                y: currentY + cardHeight + offset,
                z: 0
            };
        }

        addCard({
            id: newCardId,
            title: title || '新卡片',
            summary: [],
            tags: [],
            links: [],
            position: newPosition
        });

        // 如果有內容，儲存到新卡片
        if (content) {
            const updateCardContent = useCardStore.getState().updateCardContent;
            updateCardContent(newCardId, content);
        }

        // 將原本選取的文字替換為連結
        // 重要：使用原始選取的文字作為顯示文字，而不是卡片標題
        // 這樣即使卡片標題改變，原文顯示也不會變
        // 使用新格式：[[card:id|顯示文字]]
        const linkText = `[[card:${newCardId}|${selectedText.trim()}]]`;
        onCreateCardFromSelection?.(start, end, linkText, newCardId);
    };

    // 快速連結（最近的 5 張卡片）
    const recentCards = Object.values(cards)
        .filter(card => card.id !== currentCardId)
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
        .slice(0, 5);

    // 檢查是否有選取文字
    const hasSelection = () => {
        if (!textareaRef?.current) return false;
        const textarea = textareaRef.current;
        return textarea.selectionStart !== textarea.selectionEnd;
    };

    return (
        <>
            <ContextMenu onOpenChange={onOpenChange}>
                <ContextMenuTrigger asChild>
                    {children}
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    {/* 從選取內容建立新卡片 */}
                    <ContextMenuItem
                        onClick={handleCreateCardFromSelection}
                        className="cursor-pointer"
                        disabled={!hasSelection()}
                    >
                        <Scissors className="w-4 h-4 mr-2" />
                        從選取內容建立新卡片
                    </ContextMenuItem>

                    <ContextMenuSeparator />

                    {/* 插入連結子選單 */}
                    <ContextMenuSub>
                        <ContextMenuSubTrigger>
                            <Link2 className="w-4 h-4 mr-2" />
                            插入卡片連結
                        </ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-56">
                            {recentCards.length > 0 ? (
                                <>
                                    {recentCards.map(card => (
                                        <ContextMenuItem
                                            key={card.id}
                                            onClick={() => handleInsertLink(card)}
                                            className="cursor-pointer"
                                        >
                                            <span className="truncate">{card.title}</span>
                                        </ContextMenuItem>
                                    ))}
                                    <ContextMenuSeparator />
                                    <ContextMenuItem
                                        onClick={() => setShowLinkDialog(true)}
                                        className="cursor-pointer"
                                    >
                                        <Search className="w-4 h-4 mr-2" />
                                        搜尋更多卡片...
                                    </ContextMenuItem>
                                </>
                            ) : (
                                <ContextMenuItem disabled>
                                    尚無其他卡片
                                </ContextMenuItem>
                            )}
                        </ContextMenuSubContent>
                    </ContextMenuSub>

                    <ContextMenuSeparator />

                    {/* 插入連結語法提示 */}
                    <ContextMenuItem
                        onClick={() => onInsertLink('[[卡片ID]]')}
                        className="cursor-pointer text-muted-foreground text-xs"
                    >
                        <FileText className="w-4 h-4 mr-2" />
                        插入連結語法
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

            {/* 搜尋卡片對話框 */}
            <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>搜尋並連結卡片</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="輸入卡片標題搜尋..."
                            className="w-full px-4 py-2 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary"
                            autoFocus
                        />
                        <div className="max-h-60 overflow-y-auto space-y-1">
                            {availableCards.length > 0 ? (
                                availableCards.map(card => (
                                    <button
                                        key={card.id}
                                        onClick={() => handleInsertLink(card)}
                                        className="w-full text-left px-3 py-2 hover:bg-secondary rounded-lg transition-colors"
                                    >
                                        <p className="font-medium truncate">{card.title}</p>
                                        {card.summary && card.summary[0] && (
                                            <p className="text-xs text-muted-foreground truncate">
                                                {card.summary[0]}
                                            </p>
                                        )}
                                    </button>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">
                                    {searchQuery ? '找不到符合的卡片' : '開始輸入以搜尋'}
                                </p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default ContentContextMenu;
