'use client';

import { Suspense, useEffect } from 'react';
import Header from '@/components/Header';
import CardGraph2D from '@/components/cards/CardGraph2D';
import { useCardStore } from '@/store/useCardStore';
import { initializeSampleData } from '@/data/sampleCards';
import { Loader2 } from 'lucide-react';
import SyncConflictDialog from '@/components/SyncConflictDialog';

export default function CardsPage() {
    const { isLoading, syncConflict, forceLoadFromCloud, forceUploadToCloud, autoSyncEnabled } = useCardStore();

    // 初始化範例資料（僅在首次訪問時）
    useEffect(() => {
        initializeSampleData(useCardStore);
    }, []);

    // Ctrl+S 手動同步
    useEffect(() => {
        const handleKeyDown = async (e) => {
            // Ctrl+S (Windows/Linux) 或 Cmd+S (Mac)
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault(); // 防止瀏覽器的預設儲存行為

                try {
                    // 檢查登入狀態
                    const { useStore } = await import('@/store/useStore');
                    const isSignedIn = useStore.getState().isSignedIn;

                    if (!isSignedIn) {
                        const { toast } = await import('sonner');
                        toast.error('無法同步', {
                            description: '請先登入 Google 帳號才能同步到雲端。您可以改用「匯出資料」功能來備份。'
                        });
                        console.log('[Ctrl+S]  未登入，無法同步');
                        return;
                    }

                    // 檢查 Google API token
                    const { isGoogleApiReady } = await import('@/lib/googleDrive');
                    const apiReady = await isGoogleApiReady();

                    if (!apiReady) {
                        const { toast } = await import('sonner');
                        toast.error('同步失敗', {
                            description: 'Google 登入已過期，請點擊右上角重新登入。'
                        });
                        console.log('[Ctrl+S]  Token 已過期');
                        return;
                    }

                    // 手動觸發上傳到雲端
                    console.log('[Ctrl+S]  開始手動同步...');
                    const { forceUploadToCloud } = useCardStore.getState();
                    const { toast } = await import('sonner');

                    await forceUploadToCloud();
                    console.log('[Ctrl+S]  手動同步完成');

                    // 使用 Sonner toast 顯示成功提示
                    toast.success('已同步到雲端', {
                        description: '所有變更已保存'
                    });

                } catch (err) {
                    console.error('[Ctrl+S]  手動同步失敗:', err);
                    const { toast } = await import('sonner');

                    // 友好的錯誤提示
                    if (err.message?.includes('權限') || err.message?.includes('登入')) {
                        toast.error('同步失敗', {
                            description: 'Google 登入已過期，請點擊右上角重新登入'
                        });
                    } else {
                        toast.error('同步失敗', {
                            description: err.message || '請檢查網路連線或稍後再試'
                        });
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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
        </main >
    );
}
