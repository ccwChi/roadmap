'use client';

import { useState, useEffect } from 'react';
import { X, Link2 } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import MarkdownRenderer from './MarkdownRenderer';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';

/**
 * 卡片預覽 Drawer
 * 從側邊滑出顯示連結卡片的內容
 */
const CardDrawer = ({ cardId, open, onOpenChange, onNavigate }) => {
    const card = useCardStore(state => state.cards[cardId]);
    const content = useCardStore(state => state.cardContents[cardId]);
    const loadCardContent = useCardStore(state => state.loadCardContent);
    const cards = useCardStore(state => state.cards);

    useEffect(() => {
        if (cardId && open) {
            loadCardContent(cardId);
        }
    }, [cardId, open, loadCardContent]);

    if (!card) return null;

    // 取得連結到的卡片
    const linkedCards = card.links
        ?.filter(link => !link.isHidden)
        .map(link => cards[link.targetId])
        .filter(Boolean) || [];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                className="w-[500px] sm:w-[540px] overflow-y-auto"
            >
                <SheetHeader className="pb-4 border-b border-border">
                    <SheetTitle className="text-xl font-bold border-b-4 border-primary/30 pb-2">
                        {card.title}
                    </SheetTitle>

                    {/* 標籤 */}
                    {card.tags && card.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                            {card.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </SheetHeader>

                <div className="py-6 space-y-6">
                    {/* 摘要 */}
                    {card.summary && card.summary.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">摘要</h3>
                            <ul className="space-y-1">
                                {card.summary.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* 內容 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">內容</h3>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                            {content ? (
                                <MarkdownRenderer
                                    content={content}
                                    onCardClick={(id) => {
                                        // 在 Drawer 中點擊連結，導航到新卡片
                                        onNavigate?.(id);
                                    }}
                                />
                            ) : (
                                <p className="text-muted-foreground text-sm italic">尚無內容</p>
                            )}
                        </div>
                    </div>

                    {/* 連結到的卡片 */}
                    {linkedCards.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Link2 className="w-4 h-4" />
                                <span>連結到 ({linkedCards.length})</span>
                            </div>
                            <div className="space-y-1">
                                {linkedCards.map(linkedCard => (
                                    <button
                                        key={linkedCard.id}
                                        onClick={() => onNavigate?.(linkedCard.id)}
                                        className="block w-full text-left px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
                                    >
                                        {linkedCard.title}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部操作 */}
                <div className="absolute bottom-4 left-6 right-6">
                    <button
                        onClick={() => onNavigate?.(cardId)}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                    >
                        開啟完整編輯
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default CardDrawer;
