'use client';

import { Suspense, useEffect } from 'react';
import Header from '@/components/Header';
import CardGraph2D from '@/components/cards/CardGraph2D';
import { useCardStore } from '@/store/useCardStore';
import { initializeSampleData } from '@/data/sampleCards';

export default function CardsPage() {
    // 初始化範例資料（僅在首次訪問時）
    useEffect(() => {
        initializeSampleData(useCardStore);
    }, []);

    return (
        <main className="relative w-full h-screen overflow-hidden">
            <Header />

            <Suspense fallback={
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">載入中...</p>
                    </div>
                </div>
            }>
                <CardGraph2D />
            </Suspense>

            {/* 開發測試用：重置按鈕 */}
            <button
                onClick={() => {
                    if (confirm('確定要清除所有卡片資料嗎？這將無法復原。')) {
                        useCardStore.getState().resetStore();
                        window.location.reload();
                    }
                }}
                className="absolute bottom-4 left-20 z-50 px-3 py-1 bg-red-500/20 text-red-500 text-xs rounded hover:bg-red-500/30 transition-colors"
            >
                清除資料
            </button>

        </main >
    );
}
