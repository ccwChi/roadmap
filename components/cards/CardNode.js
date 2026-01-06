'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Link2, Tag } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import NodeToolbar from './NodeToolbar';

const CardNode = ({ data, selected, id }) => {
    const { title, summary, tags, color, linkCount } = data;
    const updateCard = useCardStore(state => state.updateCard);
    const deleteCard = useCardStore(state => state.deleteCard);
    const setCardToDelete = useCardStore(state => state.setCardToDelete);

    // Toolbar 處理函數
    const handleDelete = () => {
        setCardToDelete(id);
    };

    return (
        <div
            className={`
                group relative min-w-[240px] max-w-[280px] 
                bg-white dark:bg-slate-800
                border border-gray-200/60 dark:border-slate-600/60
                rounded-lg shadow-sm
                transition-all duration-200
                hover:shadow-lg hover:-translate-y-0.5
                ${selected ? 'shadow-lg' : ''}
            `}
        >
            {/* 迷你工具欄 */}
            <NodeToolbar
                nodeId={id}
                onDelete={handleDelete}
            />

            {/* 連接點 - 上 */}
            <Handle
                type="target"
                position={Position.Top}
                id="top-target"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />
            <Handle
                type="source"
                position={Position.Top}
                id="top-source"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />

            {/* 連接點 - 左 */}
            <Handle
                type="target"
                position={Position.Left}
                id="left-target"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="left-source"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />

            {/* 連接點 - 右 */}
            <Handle
                type="target"
                position={Position.Right}
                id="right-target"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />
            <Handle
                type="source"
                position={Position.Right}
                id="right-source"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />

            {/* 連接點 - 下 */}
            <Handle
                type="target"
                position={Position.Bottom}
                id="bottom-target"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="bottom-source"
                className="w-3 h-3 !bg-blue-500 border-2 border-white dark:border-gray-800 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            />

            {/* 卡片內容 */}
            <div className="p-4">
                {/* 標題 - 可編輯 */}
                <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-tight rounded px-1 -ml-1 transition-colors">
                        {title}
                    </h3>
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
