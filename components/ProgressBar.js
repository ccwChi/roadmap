'use client';

import { useStore } from '@/store/useStore';
import { getRoadmap } from '@/data/roadmaps';

export default function ProgressBar() {
  const currentRoadmapId = useStore((state) => state.currentRoadmapId);
  const getProgress = useStore((state) => state.getProgress);

  const roadmap = getRoadmap(currentRoadmapId);
  const totalNodes = roadmap?.nodes?.length || 0;
  const { completed, percentage } = getProgress(currentRoadmapId, totalNodes);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">學習進度</span>
        <span className="text-foreground font-medium">
          {completed} / {totalNodes} 完成
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>
    </div>
  );
}
