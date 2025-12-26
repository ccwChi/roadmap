'use client';

import { memo, useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { getRoadmapData } from '@/data/roadmaps';
import { useStore } from '@/store/useStore';

const CustomNode = ({ id, data, selected }) => {
  const currentRoadmapId = useStore((state) => state.currentRoadmapId);
  const isNodeCompleted = useStore((state) => state.isNodeCompleted);
  const isCompleted = isNodeCompleted(currentRoadmapId, id);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { categoryColors } = getRoadmapData(currentRoadmapId);
  const colors = categoryColors[data.category] || categoryColors.core;

  // 主題相關顏色
  const isDark = mounted ? resolvedTheme === 'dark' : true;
  const descriptionColor = isDark ? 'text-gray-300' : 'text-gray-600';
  const ringOffsetColor = isDark ? 'ring-offset-gray-950' : 'ring-offset-white';

  return (
    <div
      className={`px-6 py-4 rounded-lg border-2 transition-all duration-300 min-w-[200px] max-w-[250px] relative
        ${selected ? 'shadow-lg scale-105' : 'shadow-md hover:scale-102'}
        ${isCompleted ? `ring-2 ring-green-500 ring-offset-2 ${ringOffsetColor}` : ''}
      `}
      style={{
        backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : colors.bg,
        borderColor: isCompleted ? '#10b981' : colors.border,
        backdropFilter: 'blur(10px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{ background: isCompleted ? '#10b981' : colors.border }}
      />

      {/* 完成標記 */}
      {isCompleted && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <Check size={14} className="text-white" />
        </div>
      )}

      <div className="space-y-1">
        <div
          className="font-semibold text-base text-center"
          style={{ color: isCompleted ? '#10b981' : colors.text }}
        >
          {data.label}
        </div>

        {data.subtitle && (
          <div className="text-xs text-center opacity-70" style={{ color: isCompleted ? '#10b981' : colors.text }}>
            {data.subtitle}
          </div>
        )}

        {data.description && (
          <div className={`text-xs ${descriptionColor} text-center opacity-60 mt-1`}>
            {data.description}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ background: isCompleted ? '#10b981' : colors.border }}
      />
    </div>
  );
};

export default memo(CustomNode);
