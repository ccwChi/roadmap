'use client';

import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Link2, Tag } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import NodeToolbar from './NodeToolbar';

const CardNode = ({ data, selected, id }) => {
    const { title, summary, tags, color, linkCount } = data;
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(title);
    const titleInputRef = useRef(null);
    const updateCard = useCardStore(state => state.updateCard);
    const deleteCard = useCardStore(state => state.deleteCard);
    const setCardToDelete = useCardStore(state => state.setCardToDelete);

    // 當進入編輯模式時，自動聚焦
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);

    const handleTitleClick = (e) => {
        e.stopPropagation();
        setIsEditingTitle(true);
    };

    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        if (editedTitle.trim() && editedTitle !== title) {
            updateCard(id, { title: editedTitle.trim() });
        } else if (!editedTitle.trim()) {
            setEditedTitle(title); // 恢復原標題
        }
    };

    const handleTitleKeyDown = (e) => {
        // 只處理 Escape，移除 Enter 保存
        if (e.key === 'Escape') {
            setEditedTitle(title);
            setIsEditingTitle(false);
        } else if (e.key === 's' && e.ctrlKey) {
            e.preventDefault();
            handleTitleBlur();
        }
    };

    // Toolbar 處理函數
    const handleDelete = () => {
        setCardToDelete(id);
    };

    return (
        <div
            className={`
                group relative min-w-[240px] max-w-[280px] 
                bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm
                border border-gray-200/60 dark:border-gray-700/60
                rounded shadow-sm
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                ${selected ? 'ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg' : ''}
            `}
        >
            {/* 迷你工具欄 */}
            <NodeToolbar
                nodeId={id}
                onDelete={handleDelete}
            />

            {/* 連接點 - 左 */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
            />

            {/* 連接點 - 右 */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity"
            />

            {/* 卡片內容 */}
            <div className="p-4">
                {/* 標題 - 可編輯 */}
                <div className="mb-3">
                    {isEditingTitle ? (
                        <input
                            ref={titleInputRef}
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={handleTitleKeyDown}
                            className="w-full font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-400 rounded px-1 -ml-1"
                            placeholder="卡片標題..."
                        />
                    ) : (
                        <h3
                            onClick={handleTitleClick}
                            className="font-semibold text-gray-900 dark:text-gray-100 leading-tight cursor-text hover:bg-gray-100/50 dark:hover:bg-gray-700/50 rounded px-1 -ml-1 transition-colors"
                        >
                            {title}
                        </h3>
                    )}
                </div>

                {/* 摘要項目 */}
                {summary && summary.length > 0 && (
                    <ul className="space-y-1.5 mb-3 text-sm text-gray-600 dark:text-gray-400">
                        {summary.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-blue-500 dark:text-blue-400 mt-0.5 text-xs">•</span>
                                <span className="flex-1 line-clamp-1">{item}</span>
                            </li>
                        ))}
                        {summary.length > 3 && (
                            <li className="text-xs text-gray-400 dark:text-gray-500 pl-4">
                                +{summary.length - 3} 更多...
                            </li>
                        )}
                    </ul>
                )}

                {/* 底部資訊 */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
                    {/* 連結數 */}
                    {linkCount > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Link2 className="w-3.5 h-3.5" />
                            <span>{linkCount}</span>
                        </div>
                    )}

                    {/* 標籤 */}
                    {tags && tags.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ml-auto">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">
                                {tags.slice(0, 2).join(', ')}
                                {tags.length > 2 && ` +${tags.length - 2}`}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(CardNode);
