'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    addEdge,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { Plus, Eye, EyeOff } from 'lucide-react';
import { useCardStore } from '@/store/useCardStore';
import CardNode from './CardNode';
import CardModal from './CardModal';
import CustomEdge from './CustomEdge';

const nodeTypes = {
    cardNode: CardNode,
};

const edgeTypes = {
    default: CustomEdge,
    smoothstep: CustomEdge,
    straight: CustomEdge,
    step: CustomEdge,
};

// 內層組件，可以使用 useReactFlow
const CardGraph2DInner = () => {
    const [mounted, setMounted] = useState(false);
    const { resolvedTheme } = useTheme();
    const { fitView } = useReactFlow(); // ReactFlow hook for viewport control

    useEffect(() => {
        setMounted(true);
    }, []);

    // Zustand store
    const cards = useCardStore(state => state.cards);
    const showHiddenLinks = useCardStore(state => state.showHiddenLinks);
    const toggleHiddenLinks = useCardStore(state => state.toggleHiddenLinks);
    const addCard = useCardStore(state => state.addCard);
    const addLink = useCardStore(state => state.addLink);
    const removeLink = useCardStore(state => state.removeLink);
    const updateNodePosition = useCardStore(state => state.updateNodePosition);
    const getNodes = useCardStore(state => state.getNodes);
    const getEdges = useCardStore(state => state.getEdges);
    const getStats = useCardStore(state => state.getStats);
    const selectedCardId = useCardStore(state => state.selectedCardId);

    // ReactFlow 狀態
    const initialNodes = useMemo(() => getNodes(), [cards]);
    const initialEdges = useMemo(() => getEdges(), [cards, showHiddenLinks]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, defaultOnEdgesChange] = useEdgesState(initialEdges);

    // 自定義邊變更處理（處理刪除）
    const onEdgesChange = useCallback((changes) => {
        console.log('[CardGraph2D] onEdgesChange:', changes);

        // 先處理刪除操作
        changes.forEach(change => {
            if (change.type === 'remove') {
                console.log('[CardGraph2D] Remove detected, ID:', change.id);

                // 解析邊 ID: '${sourceId}-${targetId}-${index}'
                // sourceId 和 targetId 都包含 '-', 需要正確解析
                // 從最後找到 '-數字'，那是 index
                const lastDashIndex = change.id.lastIndexOf('-');
                const withoutIndex = change.id.substring(0, lastDashIndex);

                // 找第二個 'card-' 的位置
                const firstCardIndex = withoutIndex.indexOf('card-');
                const secondCardIndex = withoutIndex.indexOf('card-', firstCardIndex + 1);

                if (secondCardIndex > 0) {
                    const sourceId = withoutIndex.substring(0, secondCardIndex - 1);
                    const targetId = withoutIndex.substring(secondCardIndex);

                    console.log('[CardGraph2D] Parsed sourceId:', sourceId);
                    console.log('[CardGraph2D] Parsed targetId:', targetId);

                    removeLink(sourceId, targetId);
                    console.log('[CardGraph2D] removeLink complete');
                } else {
                    console.error('[CardGraph2D] Failed to parse edge ID:', change.id);
                }
            }
        });

        // 然後應用到 ReactFlow 狀態
        defaultOnEdgesChange(changes);
    }, [removeLink, defaultOnEdgesChange]);

    // 當 cards 變化時更新節點和邊
    useEffect(() => {
        setNodes(getNodes());
        setEdges(getEdges());
    }, [cards, showHiddenLinks, setNodes, setEdges, getNodes, getEdges]);

    // 聚焦到選中的卡片
    useEffect(() => {
        if (selectedCardId && nodes.length > 0) {
            const targetNode = nodes.find(n => n.id === selectedCardId);
            if (targetNode) {
                fitView({
                    nodes: [{ id: selectedCardId }],
                    duration: 500,
                    padding: 0.3,
                    maxZoom: 1.5
                });
            }
        }
    }, [selectedCardId, nodes, fitView]);

    // 節點點擊
    const onNodeClick = useCallback((event, node) => {
        useCardStore.setState({ selectedCardId: node.id });
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
            // 不設置默認 label，讓用戶需要時再添加
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
        setTimeout(() => useCardStore.setState({ selectedCardId: newCardId }), 100);
    }, [addCard]);

    // 關閉 Modal
    const handleCloseModal = useCallback(() => {
        useCardStore.setState({ selectedCardId: null });
    }, []);

    // 從 Modal 中點擊其他卡片
    const handleCardClick = useCallback((cardId) => {
        useCardStore.setState({ selectedCardId: cardId });
    }, []);

    // 主題相關顏色（只在客戶端載入後才使用實際主題）
    const isDark = mounted ? (resolvedTheme === 'dark') : true; // 預設深色
    const themeColors = {
        background: isDark ? '#030712' : '#ffffff',
        dots: isDark ? '#374151' : '#d1d5db',
        controlsBg: 'bg-card border-border', // 使用主題變數
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
                    edgeTypes={edgeTypes}
                    fitView
                    minZoom={0.1}
                    maxZoom={2}
                    deleteKeyCode="Delete"
                    edgesReconnectable={false}
                    edgesFocusable={true}
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

                {/* 工具列 - 清爽風格 */}
                <div className="absolute top-20 right-4 z-50 flex flex-col gap-3">
                    {/* 新增卡片 */}
                    <button
                        onClick={handleAddCard}
                        className="group flex items-center justify-center w-12 h-12 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                        title="新增卡片 (點擊)"
                    >
                        <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:rotate-90 transition-transform duration-200" />
                    </button>

                    {/* 顯示/隱藏連線 */}
                    <button
                        onClick={toggleHiddenLinks}
                        className={`group flex items-center justify-center w-12 h-12 backdrop-blur-sm border rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 ${showHiddenLinks
                            ? 'bg-blue-500/90 dark:bg-blue-600/90 border-blue-400 dark:border-blue-500'
                            : 'bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-700'
                            }`}
                        title={showHiddenLinks ? '隱藏文字連結' : '顯示文字連結'}
                    >
                        {showHiddenLinks ? (
                            <Eye className="w-5 h-5 text-white" />
                        ) : (
                            <EyeOff className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        )}
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

// 外層組件，提供 ReactFlow context
const CardGraph2D = () => {
    return (
        <ReactFlowProvider>
            <CardGraph2DInner />
        </ReactFlowProvider>
    );
};

export default CardGraph2D;
