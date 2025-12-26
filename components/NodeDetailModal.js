'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, Check, BookOpen, Save, Trash2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useStore, useUIStore } from '@/store/useStore';

export default function NodeDetailModal({ node, onClose, roadmapId }) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const { isEditingNote, setIsEditingNote } = useUIStore();

  // Store actions
  const isNodeCompleted = useStore((state) => state.isNodeCompleted);
  const toggleNodeComplete = useStore((state) => state.toggleNodeComplete);
  const getNote = useStore((state) => state.getNote);
  const setNote = useStore((state) => state.setNote);
  const deleteNote = useStore((state) => state.deleteNote);

  const isCompleted = isNodeCompleted(roadmapId, node.id);
  const savedNote = getNote(roadmapId, node.id);

  const [noteContent, setNoteContent] = useState(savedNote);

  // 當 savedNote 變化時更新本地狀態
  useEffect(() => {
    setNoteContent(savedNote);
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

  // 主題相關顏色
  const isDark = mounted ? resolvedTheme === 'dark' : true;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`rounded-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border
          ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 border-b p-6 flex items-start justify-between
          ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {node.data.label}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {node.data.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`transition-colors p-2 rounded-lg
              ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}
            `}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 完成狀態按鈕 */}
          <button
            onClick={handleToggleComplete}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isCompleted
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-600'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
            }`}
          >
            <Check size={20} />
            {isCompleted ? '已完成' : '標記為完成'}
          </button>

          {/* Main Content */}
          {node.data.content && (
            <div className="space-y-3">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>概述</h3>
              <div className={`whitespace-pre-line leading-relaxed rounded-lg p-4
                ${isDark ? 'text-gray-300 bg-gray-800/50' : 'text-gray-700 bg-gray-50'}
              `}>
                {node.data.content}
              </div>
            </div>
          )}

          {/* 筆記區域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <BookOpen size={20} />
                我的筆記
              </h3>
              {!isEditingNote && savedNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  編輯
                </button>
              )}
            </div>

            {isEditingNote || !savedNote ? (
              <div className="space-y-3">
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="在這裡記錄你的學習筆記..."
                  className={`w-full h-32 border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none
                    ${isDark
                      ? 'bg-gray-800 border-gray-600 text-gray-200 placeholder-gray-500'
                      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}
                  `}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteContent.trim()}
                    className={`flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                      ${!noteContent.trim() ? (isDark ? 'disabled:bg-gray-700 disabled:text-gray-500' : 'disabled:bg-gray-200 disabled:text-gray-400') : ''}
                    `}
                  >
                    <Save size={16} />
                    儲存筆記
                  </button>
                  {savedNote && (
                    <button
                      onClick={handleDeleteNote}
                      className="py-2 px-4 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className={`border rounded-lg p-4
                ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}
              `}>
                <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{savedNote}</p>
              </div>
            )}
          </div>

          {/* Resources */}
          {node.data.resources && node.data.resources.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>學習資源</h3>
              <div className="space-y-2">
                {node.data.resources.map((resource, index) => (
                  <a
                    key={index}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 p-3 rounded-lg transition-colors group border hover:border-blue-500
                      ${isDark
                        ? 'bg-gray-800 hover:bg-gray-750 border-gray-700'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}
                    `}
                  >
                    <ExternalLink size={16} className="text-blue-400 flex-shrink-0" />
                    <span className={`transition-colors ${isDark ? 'text-gray-200 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {resource.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`sticky bottom-0 border-t p-4
          ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <button
            onClick={onClose}
            className={`w-full py-3 font-medium rounded-lg transition-colors
              ${isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}
            `}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}
