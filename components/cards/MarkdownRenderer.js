'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useCardStore } from '@/store/useCardStore';

const MarkdownRenderer = ({ content, onCardClick }) => {
    const cards = useCardStore(state => state.cards);

    // 預處理：將 [[card:id|text]] 或 [[card:id]] 轉換為特殊的 HTML 標記
    let processedContent = content || '';

    // 處理 [[card:id|displayText]] 格式
    processedContent = processedContent.replace(
        /\[\[card:([^\]|]+)\|([^\]]+)\]\]/g,
        (match, cardId, displayText) => {
            return `<span class="card-link-inline" data-card-id="${cardId}">${displayText}</span>`;
        }
    );

    // 處理 [[card:id]] 格式（使用卡片標題作為顯示文字）
    processedContent = processedContent.replace(
        /\[\[card:([^\]]+)\]\]/g,
        (match, cardId) => {
            const card = cards[cardId];
            const displayText = card?.title || cardId;
            return `<span class="card-link-inline" data-card-id="${cardId}">${displayText}</span>`;
        }
    );

    // 處理點擊事件
    const handleClick = (e) => {
        const target = e.target;
        if (target.classList.contains('card-link-inline')) {
            e.preventDefault();
            e.stopPropagation();
            const cardId = target.getAttribute('data-card-id');
            if (cardId && onCardClick) {
                onCardClick(cardId);
            }
        }
    };

    return (
        <div className="prose prose-sm dark:prose-invert max-w-none" onClick={handleClick}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // 自訂連結渲染（保留用於外部連結）
                    a: ({ href, children, ...props }) => {
                        if (href?.startsWith('card://')) {
                            const cardId = href.replace('card://', '');
                            const targetCard = cards[cardId];

                            return (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCardClick?.(cardId);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
                                    title={targetCard ? `開啟：${targetCard.title}` : '卡片不存在'}
                                    {...props}
                                >
                                    <span className="text-xs">📄</span>
                                    {children}
                                </button>
                            );
                        }

                        // 一般外部連結
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 underline"
                                {...props}
                            >
                                {children}
                            </a>
                        );
                    },

                    // 程式碼區塊
                    code: ({ node, inline, className, children, ...props }) => {
                        if (inline) {
                            return (
                                <code
                                    className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            );
                        }

                        return (
                            <code
                                className={`block p-4 rounded-lg bg-muted overflow-x-auto ${className || ''}`}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },

                    // 標題
                    h1: ({ children, ...props }) => (
                        <h1 className="text-2xl font-bold mt-6 mb-4" {...props}>
                            {children}
                        </h1>
                    ),
                    h2: ({ children, ...props }) => (
                        <h2 className="text-xl font-bold mt-5 mb-3" {...props}>
                            {children}
                        </h2>
                    ),
                    h3: ({ children, ...props }) => (
                        <h3 className="text-lg font-semibold mt-4 mb-2" {...props}>
                            {children}
                        </h3>
                    ),

                    // 清單
                    ul: ({ children, ...props }) => (
                        <ul className="list-disc list-inside space-y-1 my-3" {...props}>
                            {children}
                        </ul>
                    ),
                    ol: ({ children, ...props }) => (
                        <ol className="list-decimal list-inside space-y-1 my-3" {...props}>
                            {children}
                        </ol>
                    ),

                    // 引用
                    blockquote: ({ children, ...props }) => (
                        <blockquote
                            className="border-l-4 border-primary pl-4 py-2 my-4 italic text-muted-foreground"
                            {...props}
                        >
                            {children}
                        </blockquote>
                    ),

                    // 表格
                    table: ({ children, ...props }) => (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border-collapse border border-border" {...props}>
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children, ...props }) => (
                        <th className="border border-border px-4 py-2 bg-muted font-semibold text-left" {...props}>
                            {children}
                        </th>
                    ),
                    td: ({ children, ...props }) => (
                        <td className="border border-border px-4 py-2" {...props}>
                            {children}
                        </td>
                    ),
                }}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
