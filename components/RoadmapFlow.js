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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
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
