'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Link2, Tag } from 'lucide-react';

const CardNode = ({ data, selected }) => {
    const { title, summary, tags, color, linkCount } = data;

    return (
        <div
            className={`
        relative min-w-[240px] max-w-[280px] bg-card border-2 rounded-xl shadow-lg
        transition-all duration-200 hover:shadow-xl
        ${selected ? 'ring-2 ring-primary ring-offset-2' : ''}
      `}
            style={{
                borderColor: color || '#3b82f6'
            }}
        >
            {/* 連接點 - 左 */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 !bg-primary border-2 border-background"
            />

            {/* 連接點 - 右 */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 !bg-primary border-2 border-background"
            />

            {/* 卡片內容 */}
            <div className="p-4">
                {/* 標題 */}
                <div className="flex items-start gap-2 mb-3">
                    <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: color || '#3b82f6' }}
                    />
                    <h3 className="font-semibold text-foreground leading-tight flex-1">
                        {title}
                    </h3>
                </div>

                {/* 摘要項目 */}
                {summary && summary.length > 0 && (
                    <ul className="space-y-1.5 mb-3 text-sm text-muted-foreground">
                        {summary.slice(0, 3).map((item, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                <span className="flex-1 line-clamp-1">{item}</span>
                            </li>
                        ))}
                        {summary.length > 3 && (
                            <li className="text-xs text-muted-foreground/60 pl-4">
                                +{summary.length - 3} 更多...
                            </li>
                        )}
                    </ul>
                )}

                {/* 底部資訊 */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                    {/* 連結數 */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Link2 className="w-3.5 h-3.5" />
                        <span>{linkCount || 0}</span>
                    </div>

                    {/* 標籤 */}
                    {tags && tags.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
