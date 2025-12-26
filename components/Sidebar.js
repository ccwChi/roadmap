'use client';

import { X, Map, ChevronRight } from 'lucide-react';
import { useStore, useUIStore } from '@/store/useStore';
import { getRoadmapList, getRoadmap } from '@/data/roadmaps';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { currentRoadmapId, setCurrentRoadmap, getProgress } = useStore();

  const roadmapList = getRoadmapList();

  const handleSelectRoadmap = (id) => {
    setCurrentRoadmap(id);
    setSidebarOpen(false);
  };

  if (!sidebarOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="fixed inset-y-0 left-0 w-80 max-w-full bg-card border-r border-border z-40 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            學習路線圖
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            選擇路線圖
          </p>

          {roadmapList.map((roadmap) => {
            const isActive = roadmap.id === currentRoadmapId;
            const fullRoadmap = getRoadmap(roadmap.id);
            const totalNodes = fullRoadmap?.nodes?.length || 0;
            const { completed, percentage } = getProgress(roadmap.id, totalNodes);

            return (
              <button
                key={roadmap.id}
                onClick={() => handleSelectRoadmap(roadmap.id)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  isActive
                    ? 'bg-primary/20 border-2 border-primary'
                    : 'bg-secondary/50 border-2 border-transparent hover:bg-secondary hover:border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{roadmap.icon}</span>
                      <span className={`font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
                        {roadmap.title}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {roadmap.description}
                    </p>

                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{completed} / {totalNodes}</span>
                        <span className="text-muted-foreground">{percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={`w-5 h-5 mt-1 transition-transform ${
                      isActive ? 'text-primary rotate-90' : 'text-muted-foreground'
                    }`}
                  />
                </div>
              </button>
            );
          })}

          <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-dashed border-border">
            <p className="text-sm text-muted-foreground text-center">
              更多路線圖即將推出...
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
