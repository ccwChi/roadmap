// Roadmap 註冊表
// 在這裡匯入所有的 roadmap，方便擴展

import { aiAgentsRoadmap } from './ai-agents';

// 所有可用的 Roadmaps
export const roadmaps = {
  'ai-agents': aiAgentsRoadmap,
  // 未來可以在這裡添加更多 roadmaps:
  // 'machine-learning': machineLearningRoadmap,
  // 'web-development': webDevRoadmap,
  // 'devops': devopsRoadmap,
};

// 取得 Roadmap 列表 (用於選擇器)
export const getRoadmapList = () => {
  return Object.values(roadmaps).map(r => ({
    id: r.id,
    title: r.title,
    description: r.description,
    icon: r.icon,
    nodeCount: r.nodes.length,
  }));
};

// 取得特定 Roadmap
export const getRoadmap = (id) => {
  return roadmaps[id] || null;
};

// 取得 Roadmap 的節點和邊
export const getRoadmapData = (id) => {
  const roadmap = roadmaps[id];
  if (!roadmap) return { nodes: [], edges: [], categoryColors: {} };

  return {
    nodes: roadmap.nodes,
    edges: roadmap.edges,
    categoryColors: roadmap.categoryColors,
  };
};

// 預設 Roadmap ID
export const DEFAULT_ROADMAP_ID = 'ai-agents';
