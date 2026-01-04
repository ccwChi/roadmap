'use client';

import { useState, useEffect } from 'react';
import { X, Edit, Save, Trash2, Link2, Tag as TagIcon } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import MarkdownRenderer from './MarkdownRenderer';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const CardModal = ({ cardId, onClose, onCardClick }) => {
    const card = useCardStore(state => state.cards[cardId]);
    const content = useCardStore(state => state.cardContents[cardId]);
    const loadCardContent = useCardStore(state => state.loadCardContent);
    const updateCardContent = useCardStore(state => state.updateCardContent);
    const updateCard = useCardStore(state => state.updateCard);
    const deleteCard = useCardStore(state => state.deleteCard);
    const cards = useCardStore(state => state.cards);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editTitle, setEditTitle] = useState('');
    const [editSummary, setEditSummary] = useState([]);

    useEffect(() => {
        if (cardId) {
            loadCardContent(cardId);
        }
    }, [cardId, loadCardContent]);

    useEffect(() => {
        if (card) {
            setEditTitle(card.title);
            setEditSummary([...card.summary]);
        }
        if (content !== undefined) {
            setEditContent(content);
        }
    }, [card, content]);

    if (!card) return null;

    const handleSave = () => {
        updateCard(cardId, {
            title: editTitle,
            summary: editSummary.filter(item => item.trim())
        });
        updateCardContent(cardId, editContent);
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (confirm('確定要刪除這張卡片嗎？此操作無法復原。')) {
            deleteCard(cardId);
            onClose();
        }
    };

    const handleSummaryChange = (index, value) => {
        const newSummary = [...editSummary];
        newSummary[index] = value;
        setEditSummary(newSummary);
    };

    const addSummaryItem = () => {
        setEditSummary([...editSummary, '']);
    };

    const removeSummaryItem = (index) => {
        setEditSummary(editSummary.filter((_, i) => i !== index));
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
        <Dialog open={!!cardId} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        {isEditing ? (
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="flex-1 text-xl font-semibold bg-transparent border-b border-border focus:border-primary outline-none px-2 py-1"
                                placeholder="卡片標題"
                            />
                        ) : (
                            <DialogTitle className="flex-1">{card.title}</DialogTitle>
                        )}

                        <div className="flex items-center gap-2">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                        title="儲存"
                                    >
                                        <Save className="w-5 h-5 text-green-500" />
                                    </button>
                                    <button
                                        onClick={() => setIsEditing(false)}
                                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                        title="取消"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                        title="編輯"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                        title="刪除"
                                    >
                                        <Trash2 className="w-5 h-5 text-red-500" />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 標籤 */}
                    {card.tags && card.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                            <TagIcon className="w-4 h-4 text-muted-foreground" />
                            {card.tags.map((tag, index) => (
                                <span
                                    key={index}
                                    className="px-2 py-1 bg-secondary text-xs rounded-md"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
                    {/* 摘要項目 */}
                    {isEditing ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                摘要項目（顯示在卡片上）
                            </label>
                            {editSummary.map((item, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={item}
                                        onChange={(e) => handleSummaryChange(index, e.target.value)}
                                        className="flex-1 px-3 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                                        placeholder={`項目 ${index + 1}`}
                                    />
                                    <button
                                        onClick={() => removeSummaryItem(index)}
                                        className="p-2 hover:bg-destructive/20 rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4 text-destructive" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addSummaryItem}
                                className="text-sm text-primary hover:underline"
                            >
                                + 新增項目
                            </button>
                        </div>
                    ) : (
                        card.summary && card.summary.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">摘要</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {card.summary.map((item, index) => (
                                        <li key={index} className="text-sm">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        )
                    )}

                    {/* 內容 */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">內容</h3>
                        {isEditing ? (
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full min-h-[300px] px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
                                placeholder="支援 Markdown 格式&#10;&#10;連結到其他卡片：[[card-id]] 或 [顯示文字](card://card-id)"
                            />
                        ) : (
                            <div className="p-4 bg-secondary rounded-lg">
                                {content ? (
                                    <MarkdownRenderer
                                        content={content}
                                        onCardClick={onCardClick}
                                    />
                                ) : (
                                    <p className="text-muted-foreground text-sm">尚無內容</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 連結資訊 */}
                    {!isEditing && (
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
                                                onClick={() => onCardClick(linkedCard.id)}
                                                className="block w-full text-left px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
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
                                                onClick={() => onCardClick(backlinkCard.id)}
                                                className="block w-full text-left px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm transition-colors"
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
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CardModal;
