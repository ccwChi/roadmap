'use client';

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
import { Cloud, Upload, AlertTriangle } from 'lucide-react';

export default function SyncConflictDialog({
    open,
    onOpenChange,
    cloudLastModified,
    localLastModified,
    onDownloadFromCloud,
    onUploadToCloud
}) {
    const formatDate = (isoString) => {
        if (!isoString) return '未知';
        const date = new Date(isoString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <AlertDialogTitle>同步衝突</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription asChild>
                        <div className="space-y-3 text-left text-sm text-muted-foreground">
                            <div>偵測到本地與雲端資料不一致，請選擇同步方向：</div>

                            <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">雲端最後更新：</span>
                                    <span className="font-medium text-foreground">{formatDate(cloudLastModified)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">本地最後修改：</span>
                                    <span className="font-medium text-foreground">{formatDate(localLastModified)}</span>
                                </div>
                            </div>

                            <div className="text-xs text-muted-foreground">
                                選擇後將覆蓋另一端的資料
                            </div>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>
                        取消
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDownloadFromCloud}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Cloud className="w-4 h-4 mr-2" />
                        從雲端下載
                    </AlertDialogAction>
                    <AlertDialogAction
                        onClick={onUploadToCloud}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        上傳到雲端
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
