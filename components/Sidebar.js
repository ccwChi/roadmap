'use client';

import { useState } from 'react';
import {
  Map,
  ChevronRight,
  ChevronDown,
  Settings,
  Music,
  Route,
  FileText,
  Search
} from 'lucide-react';
import { useUIStore } from '@/store/useStore';
import { useCardStore } from '@/store/useCardStore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, setSettingsOpen } = useUIStore();
  const { cards } = useCardStore();

  const [expandedSections, setExpandedSections] = useState({
    maps: true,
    learning: false,
    music: false
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 過濾卡片
  const filteredCards = Object.values(cards).filter(card =>
    card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cardCount = Object.keys(cards).length;

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-80 max-w-full overflow-y-auto">
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
            <button
              onClick={() => toggleSection('maps')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Map className="w-4 h-4 text-primary" />
                <span className="font-medium">知識地圖</span>
                <span className="text-xs text-muted-foreground">({cardCount})</span>
              </div>
              {expandedSections.maps ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedSections.maps && (
              <div className="ml-6 mt-1 space-y-0.5 max-h-96 overflow-y-auto">
                {filteredCards.length > 0 ? (
                  filteredCards.map(card => (
                    <button
                      key={card.id}
                      onClick={() => {
                        // TODO: 實作卡片聚焦功能
                        console.log('Focus on card:', card.id);
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

          {/* 學習路徑區塊 (未來功能) */}
          <div>
            <button
              onClick={() => toggleSection('learning')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">學習路徑</span>
                <span className="text-xs text-muted-foreground">(即將推出)</span>
              </div>
            </button>
          </div>

          {/* 音樂設定區塊 (未來功能) */}
          <div>
            <button
              onClick={() => toggleSection('music')}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">音樂設定</span>
                <span className="text-xs text-muted-foreground">(即將推出)</span>
              </div>
            </button>
          </div>

          {/* 分隔線 */}
          <div className="my-4 border-t border-border" />

          {/* 設定 */}
          <button
            onClick={() => {
              setSettingsOpen(true);
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2 p-3 rounded-lg hover:bg-secondary transition-colors"
          >
            <Settings className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">設定</span>
          </button>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-lg border border-dashed border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 點擊卡片可快速定位到地圖上
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
