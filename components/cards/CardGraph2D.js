'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import CardNode from './CardNode';
import CardModal from './CardModal';

const nodeTypes = {
    cardNode: CardNode,
};

const CardGraph2D = () => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const [selectedCardId, setSelectedCardId] = useState(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Zustand store
    const cards = useCardStore(state => state.cards);
    const showHiddenLinks = useCardStore(state => state.showHiddenLinks);
    const toggleHiddenLinks = useCardStore(state => state.toggleHiddenLinks);
    const addCard = useCardStore(state => state.addCard);
    const addLink = useCardStore(state => state.addLink);
    const updateNodePosition = useCardStore(state => state.updateNodePosition);
    const getNodes = useCardStore(state => state.getNodes);
    const getEdges = useCardStore(state => state.getEdges);
    const getStats = useCardStore(state => state.getStats);

    // ReactFlow 狀態
    const initialNodes = useMemo(() => getNodes(), [cards]);
    const initialEdges = useMemo(() => getEdges(), [cards, showHiddenLinks]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // 當 cards 變化時更新節點和邊
    useEffect(() => {
        setNodes(getNodes());
        setEdges(getEdges());
    }, [cards, showHiddenLinks, setNodes, setEdges, getNodes, getEdges]);

    // 節點點擊
    const onNodeClick = useCallback((event, node) => {
        setSelectedCardId(node.id);
    }, []);

    // 節點拖曳結束
    const onNodeDragStop = useCallback((event, node) => {
        updateNodePosition(node.id, {
            x: node.position.x,
            y: node.position.y,
            z: 0 // 2D 模式固定為 0
        });
    }, [updateNodePosition]);

    // 連線建立
    const onConnect = useCallback((connection) => {
        addLink(connection.source, connection.target, {
            type: 'reference',
            label: '連結'
        });
    }, [addLink]);

    // 新增卡片
    const handleAddCard = useCallback(() => {
        // 在畫布中心新增卡片
        const viewport = document.querySelector('.react-flow__viewport');
        const rect = viewport?.getBoundingClientRect();
        const centerX = rect ? (rect.width / 2) : 0;
        const centerY = rect ? (rect.height / 2) : 0;

        const newCardId = addCard({
            title: '新卡片',
            summary: [],
            position: { x: centerX, y: centerY, z: 0 }
        });

        // 開啟新卡片的 Modal
        setTimeout(() => setSelectedCardId(newCardId), 100);
    }, [addCard]);

    // 關閉 Modal
    const handleCloseModal = useCallback(() => {
        setSelectedCardId(null);
    }, []);

    // 從 Modal 中點擊其他卡片
    const handleCardClick = useCallback((cardId) => {
        setSelectedCardId(cardId);
    }, []);

    // 主題相關顏色（只在客戶端載入後才使用實際主題）
    const isDark = mounted ? (resolvedTheme === 'dark') : true; // 預設深色
    const themeColors = {
        background: isDark ? '#030712' : '#ffffff',
        dots: isDark ? '#374151' : '#d1d5db',
        controlsBg: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        minimapMask: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    };

    const stats = getStats();

    // 只在客戶端渲染 ReactFlow
    if (!mounted) {
        return (
            <div className="w-full h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">載入中...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full h-screen bg-background relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onNodeDragStop={onNodeDragStop}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.1}
                    maxZoom={2}
                    defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: true,
                        markerEnd: {
                            type: MarkerType.ArrowClosed,
                            width: 20,
                            height: 20,
                        },
                    }}
                    style={{
                        backgroundColor: resolvedTheme === 'dark' ? themeColors.background : '#e7ebf0ff'
                    }}
                >
                    <Background
                        color={themeColors.dots}
                        gap={16}
                        size={1}
                        variant="dots"
                    />
                    <Controls
                        className={`${themeColors.controlsBg} border rounded-lg`}
                        showInteractive={false}
                    />
                    {/* <MiniMap
                        nodeColor={(node) => {
                            return node.data.color || '#3b82f6';
                        }}
                        className={`${themeColors.controlsBg} border rounded-lg`}
                        maskColor={themeColors.minimapMask}
                    /> */}
                </ReactFlow>

                {/* 工具列 */}
                <div className="absolute top-18 right-6 z-50 flex flex-col gap-2">
                    {/* 新增卡片 */}
                    <button
                        onClick={handleAddCard}
                        className="flex flex-row items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-lg hover:bg-primary/90 transition-colors"
                        style={{ writingMode: 'vertical-lr' }}
                        title="新增卡片"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="hidden sm:inline">新增卡片</span>
                    </button>

                    {/* 顯示/隱藏隱藏連線 */}
                    <button
                        onClick={toggleHiddenLinks}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${showHiddenLinks
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-card border border-border hover:bg-secondary'
                            }`}
                        style={{ writingMode: 'vertical-lr' }}
                        title={showHiddenLinks ? '隱藏文字連結' : '顯示文字連結'}
                    >
                        {showHiddenLinks ? (
                            <Eye className="w-5 h-5" />
                        ) : (
                            <EyeOff className="w-5 h-5" />
                        )}
                        <span className="hidden sm:inline">
                            {showHiddenLinks ? '隱藏' : '顯示'}文字連結
                        </span>
                    </button>
                </div>

                {/* 統計資訊 */}
                {/* <div className="absolute bottom-6 left-6 z-10 bg-card/90 backdrop-blur-md border border-border rounded-lg p-4 shadow-xl">
                    <h3 className="text-sm font-semibold mb-2">統計資訊</h3>
                    <div className="space-y-1 text-sm text-muted-foreground">
                        <div>卡片數量：{stats.totalCards}</div>
                        <div>連結數量：{stats.totalLinks}</div>
                        <div>平均連結：{stats.avgLinksPerCard}</div>
                        {stats.tags.length > 0 && (
                            <div>標籤：{stats.tags.length} 個</div>
                        )}
                    </div>
                </div> */}
            </div>

            {/* 卡片 Modal */}
            {selectedCardId && (
                <CardModal
                    cardId={selectedCardId}
                    onClose={handleCloseModal}
                    onCardClick={handleCardClick}
                />
            )}
        </>
    );
};

export default CardGraph2D;
