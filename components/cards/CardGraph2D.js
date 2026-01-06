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
import ResizableCardSheet from './ResizableCardSheet';
import CustomEdge from './CustomEdge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    const { fitView, setCenter, getZoom } = useReactFlow(); // ReactFlow hook for viewport control

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
    const cardToDelete = useCardStore(state => state.cardToDelete);
    const setCardToDelete = useCardStore(state => state.setCardToDelete);
    const deleteCard = useCardStore(state => state.deleteCard);

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

    // 聚焦到選中的卡片 - 已停用，改用 handleCardFocus 來處理
    // 這個 useEffect 會將卡片居中到整個螢幕，與新的「居中到左側空間」功能衝突
    /* useEffect(() => {
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
    }, [selectedCardId, nodes, fitView]); */

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

    // 關閉 Sheet
    const handleCloseSheet = useCallback(() => {
        useCardStore.setState({ selectedCardId: null });
    }, []);

    // 聚焦到卡片（當在 Sheet 中切換 tab 時）
    // sheetWidthPercent: Sheet 的寬度百分比（例如 50 表示 50%）
    const handleCardFocus = useCallback((cardId, sheetWidthPercent = 50) => {
        if (cardId && nodes.length > 0) {
            const targetNode = nodes.find(n => n.id === cardId);
            if (targetNode) {
                // 計算左側可用空間的寬度
                const viewportWidth = window.innerWidth;
                const leftSpaceRatio = (100 - sheetWidthPercent) / 100;
                const leftSpaceWidth = viewportWidth * leftSpaceRatio;

                // 計算左側空間的中心點（在視窗座標系中）
                const centerXInViewport = leftSpaceWidth / 2;

                // 獲取當前縮放比例
                const currentZoom = getZoom();

                // 計算節點在左側空間中心時的座標
                // setCenter 需要的是節點的實際座標
                const nodeX = targetNode.position.x;
                const nodeY = targetNode.position.y;

                // 計算偏移量：左側空間中心相對於整個視窗中心的偏移
                const viewportCenterX = viewportWidth / 2;
                const offsetX = (centerXInViewport - viewportCenterX) / currentZoom;

                // 使用 setCenter 移動視圖，帶動畫
                setCenter(nodeX - offsetX, nodeY, { zoom: currentZoom, duration: 300 });
            }
        }
    }, [nodes, getZoom, setCenter]);

    // 主題相關顏色
    const isDark = mounted ? (resolvedTheme === 'dark') : true;
    const themeColors = {
        background: isDark ? '#030712' : '#ffffff',
        dots: isDark ? '#374151' : '#d1d5db',
        // 使用 CSS class 來覆蓋 ReactFlow Controls 樣式
        // 強制覆蓋背景色和邊框顏色
        controlsClassName: isDark
            ? '!bg-gray-800 !border-gray-700 [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button:hover]:!bg-gray-700 [&_svg]:!fill-gray-200'
            : '!bg-white !border-gray-200 [&>button]:!bg-white [&>button]:!border-gray-200 [&>button:hover]:!bg-gray-50 [&_svg]:!fill-gray-700',
        minimapMask: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
    };

    const stats = getStats();

    const confirmDelete = () => {
        if (cardToDelete) {
            deleteCard(cardToDelete);
            setCardToDelete(null);
        }
    };

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
                    onPaneClick={() => {
                        // 點擊空白區域時，只在沒有打開 Sheet 的情況下清除選中狀態
                        if (!selectedCardId) {
                            // 如果沒有選中的卡片，不做任何事
                            return;
                        }
                        // 注意：這裡我們不清除 selectedCardId，因為這會影響 Sheet
                        // ring 效果會在點擊其他節點或關閉 Sheet 時自然消失
                    }}
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
                        className={`${themeColors.controlsClassName} border rounded-lg shadow-sm`}
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

            {/* 卡片編輯 Sheet */}
            <ResizableCardSheet
                open={!!selectedCardId}
                onClose={handleCloseSheet}
                onCardFocus={handleCardFocus}
            />

            {/* 刪除確認對話框 */}
            <AlertDialog open={!!cardToDelete} onOpenChange={(open) => !open && setCardToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確定要刪除這張卡片嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                            此操作無法撤銷。卡片及其相關連線都將被刪除。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCardToDelete(null)}>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                            刪除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
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
