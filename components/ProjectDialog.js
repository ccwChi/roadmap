'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMOJI_OPTIONS = ['📝', '📁', '🎯', '💡', '🚀', '📚', '🎨', '⚡', '🌟', '🔥', '💻', '🎓'];

export default function ProjectDialog({
    open,
    onOpenChange,
    project = null, // null = 新增模式，有值 = 編輯模式
    onSave
}) {
    const [name, setName] = useState('');
    const [icon, setIcon] = useState('📁');

    // 當 project 改變時更新表單
    useEffect(() => {
        if (project) {
            setName(project.name || '');
            setIcon(project.icon || '📁');
        } else {
            setName('');
            setIcon('📁');
        }
    }, [project, open]);

    const handleSave = () => {
        if (!name.trim()) {
            alert('請輸入專案名稱');
            return;
        }

        onSave({ name: name.trim(), icon });
        onOpenChange(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{project ? '編輯專案' : '新增專案'}</DialogTitle>
                    <DialogDescription>
                        {project ? '修改專案名稱和圖示' : '建立一個新的知識地圖專案'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* 專案名稱 */}
                    <div className="space-y-2">
                        <Label htmlFor="project-name">專案名稱</Label>
                        <Input
                            id="project-name"
                            placeholder="例如：AI 學習、前端開發..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoFocus
                        />
                    </div>

                    {/* 圖示選擇 */}
                    <div className="space-y-2">
                        <Label>圖示</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {EMOJI_OPTIONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setIcon(emoji)}
                                    className={`p-3 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${icon === emoji
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleSave}>
                        {project ? '儲存' : '建立'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
