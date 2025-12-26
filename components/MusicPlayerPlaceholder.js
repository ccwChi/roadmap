'use client';

import { useState } from 'react';
import { Music, X, Construction } from 'lucide-react';

export default function MusicPlayerPlaceholder() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-10 p-3 rounded-full bg-card border border-border shadow-lg hover:bg-secondary transition-colors"
        aria-label="音樂播放器"
      >
        <Music className="w-5 h-5 text-foreground" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-20 right-6 z-50 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-foreground font-semibold flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-500" />
                音樂播放器
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Construction className="w-8 h-8 text-yellow-500" />
              </div>
              <h4 className="text-foreground font-medium mb-2">功能開發中</h4>
              <p className="text-sm text-muted-foreground">
                未來將支援背景音樂播放
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
