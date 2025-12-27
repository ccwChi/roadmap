'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Check, BookOpen, Save, Trash2 } from 'lucide-react';
import { useStore, useUIStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export default function NodeDetailModal({ node, onClose, roadmapId }) {
  const { isEditingNote, setIsEditingNote } = useUIStore();

  // Store actions
  const isNodeCompleted = useStore((state) => state.isNodeCompleted);
  const toggleNodeComplete = useStore((state) => state.toggleNodeComplete);
  const getNote = useStore((state) => state.getNote);
  const setNote = useStore((state) => state.setNote);
  const deleteNote = useStore((state) => state.deleteNote);

  const isCompleted = isNodeCompleted(roadmapId, node?.id);
  const savedNote = getNote(roadmapId, node?.id);

  const [noteContent, setNoteContent] = useState(savedNote || '');

  // 當 savedNote 變化時更新本地狀態
  useEffect(() => {
    setNoteContent(savedNote || '');
  }, [savedNote]);

  if (!node) return null;

  const handleToggleComplete = () => {
    toggleNodeComplete(roadmapId, node.id);
  };

  const handleSaveNote = () => {
    setNote(roadmapId, node.id, noteContent);
    setIsEditingNote(false);
  };

  const handleDeleteNote = () => {
    deleteNote(roadmapId, node.id);
    setNoteContent('');
    setIsEditingNote(false);
  };

  return (
    <Dialog open={!!node} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{node.data.label}</DialogTitle>
          <DialogDescription>{node.data.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 完成狀態按鈕 */}
          <Button
            onClick={handleToggleComplete}
            variant={isCompleted ? 'default' : 'secondary'}
            className={`w-full ${isCompleted ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >
            <Check className="w-5 h-5 mr-2" />
            {isCompleted ? '已完成' : '標記為完成'}
          </Button>

          {/* Main Content */}
          {node.data.content && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">概述</h3>
              <div className="whitespace-pre-line leading-relaxed rounded-lg p-4 bg-secondary text-secondary-foreground">
                {node.data.content}
              </div>
            </div>
          )}

          {/* 筆記區域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                我的筆記
              </h3>
              {!isEditingNote && savedNote && (
                <Button
                  variant="link"
                  onClick={() => setIsEditingNote(true)}
                  className="text-primary"
                >
                  編輯
                </Button>
              )}
            </div>

            {isEditingNote || !savedNote ? (
              <div className="space-y-3">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="在這裡記錄你的學習筆記..."
                  className="w-full h-32 border rounded-lg p-3 bg-background text-foreground border-border focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none placeholder:text-muted-foreground"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveNote}
                    disabled={!noteContent.trim()}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    儲存筆記
                  </Button>
                  {savedNote && (
                    <Button
                      variant="destructive"
                      onClick={handleDeleteNote}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-secondary border-border">
                <p className="whitespace-pre-wrap text-secondary-foreground">{savedNote}</p>
              </div>
            )}
          </div>

          {/* Resources */}
          {node.data.resources && node.data.resources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">學習資源</h3>
              <div className="space-y-2">
                {node.data.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 rounded-lg transition-colors group border bg-secondary border-border hover:border-primary"
                  >
                    <ExternalLink className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-secondary-foreground group-hover:text-foreground transition-colors">
                      {resource.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} className="w-full">
            關閉
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
