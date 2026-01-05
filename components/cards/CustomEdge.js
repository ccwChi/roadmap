'use client';

import { BaseEdge, EdgeLabelRenderer, getBezierPath, getStraightPath, getSmoothStepPath } from '@xyflow/react';
import { memo, useState, useRef, useEffect } from 'react';

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    label,
    data
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedLabel, setEditedLabel] = useState(label || '');
    const [isHovered, setIsHovered] = useState(false);
    const inputRef = useRef(null);
    const edgeRef = useRef(null);

    // 同步外部 label 到內部狀態
    useEffect(() => {
        setEditedLabel(label || '');
    }, [label]);

    // 當進入編輯模式時聚焦
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    // 根據type選擇路徑計算函數
    const edgeType = data?.type || 'smoothstep';
    let edgePath, labelX, labelY;

    if (edgeType === 'straight') {
        [edgePath, labelX, labelY] = getStraightPath({
            sourceX, sourceY, sourcePosition,
            targetX, targetY, targetPosition,
        });
    } else if (edgeType === 'step') {
        [edgePath, labelX, labelY] = getSmoothStepPath({
            sourceX, sourceY, sourcePosition,
            targetX, targetY, targetPosition,
        });
    } else {
        // default: bezier/smoothstep
        [edgePath, labelX, labelY] = getBezierPath({
            sourceX, sourceY, sourcePosition,
            targetX, targetY, targetPosition,
        });
    }

    const startEditing = () => {
        setIsEditing(true);
    };

    const handleLabelClick = (e) => {
        e.stopPropagation();
        startEditing();
    };

    const handleLabelBlur = () => {
        setIsEditing(false);

        // 解析邊 ID: '${sourceId}-${targetId}-${index}'
        // sourceId 和 targetId 都包含 '-'
        const lastDashIndex = id.lastIndexOf('-');
        const withoutIndex = id.substring(0, lastDashIndex);

        const firstCardIndex = withoutIndex.indexOf('card-');
        const secondCardIndex = withoutIndex.indexOf('card-', firstCardIndex + 1);

        if (secondCardIndex > 0) {
            const sourceId = withoutIndex.substring(0, secondCardIndex - 1);
            const targetId = withoutIndex.substring(secondCardIndex);

            // 調用 store 更新標籤
            const { useCardStore } = require('@/store/useCardStore');
            useCardStore.getState().updateLinkLabel(sourceId, targetId, editedLabel);

            console.log('[CustomEdge] 標籤已保存:', sourceId, '→', targetId, ':', editedLabel || '(已刪除)');
        } else {
            console.error('[CustomEdge] Failed to parse edge ID:', id);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setEditedLabel(label || '');
            setIsEditing(false);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            handleLabelBlur();
        }
    };

    // 決定是否顯示標籤
    const hasLabel = editedLabel || label;
    const showLabel = hasLabel || isEditing || isHovered;

    return (
        <>
            {/* 邊線 - 添加雙擊監聽 */}
            <g
                ref={edgeRef}
                onDoubleClick={startEditing}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <BaseEdge
                    path={edgePath}
                    markerEnd={markerEnd}
                    style={style}
                />
            </g>

            {/* 標籤渲染 */}
            {showLabel && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                        }}
                        className="nodrag nopan"
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                    >
                        {isEditing ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={editedLabel}
                                onChange={(e) => setEditedLabel(e.target.value)}
                                onBlur={handleLabelBlur}
                                onKeyDown={handleKeyDown}
                                className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border-2 border-blue-400 rounded shadow-lg outline-none min-w-[80px]"
                                placeholder="輸入標籤（留空可刪除）..."
                            />
                        ) : hasLabel ? (
                            <div
                                onClick={handleLabelClick}
                                className="px-2 py-1 text-xs bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
                                title="點擊編輯，清空可刪除"
                            >
                                {editedLabel || label}
                            </div>
                        ) : (
                            <div
                                onClick={handleLabelClick}
                                onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    startEditing();
                                }}
                                className="px-2 py-1 text-xs bg-blue-500/90 text-white rounded shadow-sm cursor-pointer hover:bg-blue-600 transition-all opacity-80"
                                title="點擊或雙擊連線添加標籤"
                            >
                                + 標籤
                            </div>
                        )}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
};

export default memo(CustomEdge);
