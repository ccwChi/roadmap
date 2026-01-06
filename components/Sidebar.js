'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Map,
  ChevronRight,
  ChevronDown,
  Music,
  Route,
  Plus,
  Search,
  Trash2,
  Edit2,
  Sun,
  Moon
} from 'lucide-react';
import { useUIStore } from '@/store/useStore';
import { useCardStore } from '@/store/useCardStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Input } from '@/components/ui/input';
import ProjectDialog from './ProjectDialog';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const {
    projects,
    currentProjectId,
    cards,
    addProject,
    updateProject,
    switchProject,
    deleteProject
  } = useCardStore();

  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState({ [currentProjectId]: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // 確保在客戶端渲染
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleProject = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const handleAddProject = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };

  const handleEditProject = (project, e) => {
    e.stopPropagation();
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleSaveProject = (projectData) => {
    if (editingProject) {
      // 編輯模式
      updateProject(editingProject.id, projectData);
    } else {
      // 新增模式
      addProject(projectData);
    }
  };

  const handleDeleteProjectClick = (projectId, e) => {
    e.stopPropagation();
    setProjectToDelete(projectId);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  // 取得專案的卡片
  const getProjectCards = (projectId) => {
    return Object.values(cards).filter(card =>
      card.projectId === projectId &&
      (card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  };

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-80 max-w-full overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Map className="w-5 h-5 text-primary" />
            導航
          </SheetTitle>
        </SheetHeader>

        {/* 搜尋框 */}
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜尋卡片..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="mt-6 space-y-1">
          {/* 知識地圖區塊 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Map className="w-4 h-4" />
                <span>知識地圖</span>
              </div>
              <button
                onClick={handleAddProject}
                className="p-1 rounded hover:bg-secondary transition-colors"
                title="新增專案"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* 專案列表 */}
            <div className="space-y-0.5">
              {Object.values(projects).map(project => {
                const projectCards = getProjectCards(project.id);
                const isActive = project.id === currentProjectId;
                const isExpanded = expandedProjects[project.id];

                return (
                  <div key={project.id}>
                    {/* 專案標題 */}
                    <div
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'
                        }`}
                    >
                      <div
                        onClick={() => {
                          switchProject(project.id);
                          toggleProject(project.id);
                        }}
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <span className="text-lg">{project.icon}</span>
                        <span className="font-medium truncate">{project.name}</span>
                        <span className="text-xs text-muted-foreground">({projectCards.length})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project, e);
                          }}
                          className="p-1 hover:bg-secondary rounded transition-colors"
                          title="編輯專案"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        {project.id !== 'default' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProjectClick(project.id, e);
                            }}
                            className="p-1 hover:bg-destructive/20 rounded transition-colors"
                            title="刪除專案"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 卡片列表 */}
                    {isExpanded && (
                      <div className="ml-6 mt-1 space-y-0.5">
                        {projectCards.length > 0 ? (
                          projectCards.map(card => (
                            <button
                              key={card.id}
                              onClick={() => {
                                useCardStore.setState({ selectedCardId: card.id });
                                setSidebarOpen(false);
                              }}
                              className="w-full text-left p-2 rounded hover:bg-secondary/50 transition-colors group"
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                                  style={{ backgroundColor: card.color }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                    {card.title}
                                  </p>
                                  {card.tags && card.tags.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                      {card.tags.slice(0, 3).map((tag, idx) => (
                                        <span
                                          key={idx}
                                          className="text-xs px-1.5 py-0.5 bg-secondary rounded text-muted-foreground"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground p-2">
                            {searchQuery ? '找不到符合的卡片' : '尚無卡片'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 學習路徑區塊 (未來功能) */}
          <div className="mt-4">
            <button
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              <Route className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">學習路徑</span>
              <span className="text-xs text-muted-foreground">(即將推出)</span>
            </button>
          </div>

          {/* 音樂設定區塊 (未來功能) */}
          <div>
            <button
              className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              <Music className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">音樂設定</span>
              <span className="text-xs text-muted-foreground">(即將推出)</span>
            </button>
          </div>

          {/* 分隔線 */}
          <div className="my-4 border-t border-border" />

          {/* 深淺模式切換 */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            {mounted && resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Moon className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="font-medium">
              {mounted && resolvedTheme === 'dark' ? '淺色模式' : '深色模式'}
            </span>
          </button>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-dashed border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 點擊 + 新增專案，點擊卡片可快速定位
          </p>
        </div>
      </SheetContent>

      {/* 專案編輯對話框 */}
      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        project={editingProject}
        onSave={handleSaveProject}
      />

      {/* 刪除確認對話框 */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此專案嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              將刪除專案及其所有卡片，此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700">
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
