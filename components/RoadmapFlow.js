'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { Lock, Unlock, Download } from 'lucide-react';

import CustomNode from './CustomNode';
import NodeDetailModal from './NodeDetailModal';
import { getRoadmapData } from '@/data/roadmaps';
import { useStore, useUIStore } from '@/store/useStore';

const nodeTypes = {
  custom: CustomNode,
};

export default function RoadmapFlow() {
  const currentRoadmapId = useStore((state) => state.currentRoadmapId);
  const { selectedNode, setSelectedNode } = useUIStore();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLocked, setIsLocked] = useState(true); // 預設鎖定

  useEffect(() => {
    setMounted(true);
  }, []);

  // 取得當前 Roadmap 的資料
  const { nodes: initialNodes, edges: initialEdges, categoryColors } = useMemo(
    () => getRoadmapData(currentRoadmapId),
    [currentRoadmapId]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, [setSelectedNode]);

  const closeModal = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // 匯出節點座標
  const exportPositions = useCallback(() => {
    const positions = nodes.map(node => ({
      id: node.id,
      position: node.position,
    }));

    const jsonStr = JSON.stringify(positions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentRoadmapId}-positions.json`;
    a.click();
    URL.revokeObjectURL(url);

    // 同時複製到剪貼簿
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert('座標已匯出並複製到剪貼簿！');
    });
  }, [nodes, currentRoadmapId]);

  // 主題相關顏色
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const themeColors = {
    background: isDark ? '#030712' : '#ffffff',
    dots: isDark ? '#374151' : '#d1d5db',
    edge: isDark ? '#4b5563' : '#9ca3af',
    controlsBg: isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    minimapMask: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)',
  };

  return (
    <>
      <div className="w-full h-screen bg-background">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isLocked ? undefined : onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          nodesDraggable={!isLocked}
          fitView
          minZoom={0.3}
          maxZoom={2}
          defaultEdgeOptions={{
            style: { stroke: themeColors.edge, strokeWidth: 2 },
            animated: true,
          }}
          style={{ backgroundColor: themeColors.background }}
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
          <MiniMap
            nodeColor={(node) => {
              const category = node.data.category;
              return categoryColors[category]?.border || '#3b82f6';
            }}
            className={`${themeColors.controlsBg} border rounded-lg`}
            maskColor={themeColors.minimapMask}
          />
        </ReactFlow>

        {/* 編輯工具列 */}
        <div className="absolute bottom-6 right-6 z-10 flex gap-2">
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`p-3 rounded-lg border shadow-lg transition-colors ${
              isLocked
                ? 'bg-card border-border hover:bg-secondary'
                : 'bg-orange-500/20 border-orange-500 text-orange-500'
            }`}
            title={isLocked ? '解鎖編輯' : '鎖定編輯'}
          >
            {isLocked ? (
              <Lock className="w-5 h-5" />
            ) : (
              <Unlock className="w-5 h-5" />
            )}
          </button>
          {!isLocked && (
            <button
              onClick={exportPositions}
              className="p-3 rounded-lg bg-blue-500/20 border border-blue-500 text-blue-500 shadow-lg hover:bg-blue-500/30 transition-colors"
              title="匯出座標"
            >
              <Download className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {selectedNode && (
        <NodeDetailModal
          node={selectedNode}
          onClose={closeModal}
          roadmapId={currentRoadmapId}
        />
      )}
    </>
  );
}
