'use client';

import { Suspense, useEffect } from 'react';
import Header from '@/components/Header';
import CardGraph2D from '@/components/cards/CardGraph2D';
import { useCardStore } from '@/store/useCardStore';
import { initializeSampleData } from '@/data/sampleCards';
import { Loader2 } from 'lucide-react';
import SyncConflictDialog from '@/components/SyncConflictDialog';

export default function CardsPage() {
    const { isLoading, syncConflict, forceLoadFromCloud, forceUploadToCloud } = useCardStore();

    // 初始化範例資料（僅在首次訪問時）
    useEffect(() => {
        initializeSampleData(useCardStore);
    }, []);

    const handleDownloadFromCloud = async () => {
        if (!syncConflict) return;
        await forceLoadFromCloud(syncConflict.cloudData);
        useCardStore.setState({ syncConflict: null });
    };

    const handleUploadToCloud = async () => {
        if (!syncConflict) return;
        await forceUploadToCloud();
        useCardStore.setState({ syncConflict: null });
    };

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

            {/* 雲端資料載入中 */}
            {isLoading && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-card border border-border rounded-lg p-6 shadow-lg text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium mb-1">正在載入雲端資料</p>
                        <p className="text-sm text-muted-foreground">請稍候...</p>
                    </div>
                </div>
            )}

            {/* 同步衝突對話框 */}
            <SyncConflictDialog
                open={!!syncConflict}
                onOpenChange={(open) => !open && useCardStore.setState({ syncConflict: null })}
                cloudLastModified={syncConflict?.cloudData?.lastModified}
                localLastModified={syncConflict?.localLastModified}
                onDownloadFromCloud={handleDownloadFromCloud}
                onUploadToCloud={handleUploadToCloud}
            />

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
