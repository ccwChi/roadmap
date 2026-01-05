'use client';

import { memo } from 'react';
import { Trash2 } from 'lucide-react';

const NodeToolbar = ({ nodeId, onDelete }) => {
    return (
        <div className="absolute -top-12 right-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
            {/* 刪除 */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                title="刪除節點"
            >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
        </div>
    );
};

export default memo(NodeToolbar);
