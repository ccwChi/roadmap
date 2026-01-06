'use client';

import { useState, useRef, useEffect } from 'react';
import { useCardStore } from '@/store/useCardStore';

/**
 * 富文本編輯器組件
 * 支援卡片連結的隱藏式顯示（類似 Word）
 */
const RichTextEditor = ({
    value,
    onChange,
    onBlur,
    placeholder = '開始輸入...',
    className = '',
    autoFocus = false,
    onCardClick
}) => {
    const editorRef = useRef(null);
    const cards = useCardStore(state => state.cards);
    const [isFocused, setIsFocused] = useState(false);

    // 將 Markdown 轉換為可編輯的 HTML
    const markdownToEditableHtml = (markdown) => {
        if (!markdown) return '';

        // 處理卡片連結：[文字](card://id) -> <a data-card-id="id">文字</a>
        let html = markdown.replace(
            /\[([^\]]+)\]\(card:\/\/([^)]+)\)/g,
            (match, text, cardId) => {
                const card = cards[cardId];
                const displayText = text || card?.title || cardId;
                return `<a class="card-link" data-card-id="${cardId}" contenteditable="false">${displayText}</a>`;
            }
        );

        // 處理 [[card-id]] 語法
        html = html.replace(
            /\[\[([^\]]+)\]\]/g,
            (match, cardId) => {
                const card = cards[cardId];
                const displayText = card?.title || cardId;
                return `<a class="card-link" data-card-id="${cardId}" contenteditable="false">${displayText}</a>`;
            }
        );

        // 簡單的 Markdown 處理
        html = html
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');

        return html;
    };

    // 將可編輯的 HTML 轉換回 Markdown
    const editableHtmlToMarkdown = (html) => {
        if (!html) return '';

        const div = document.createElement('div');
        div.innerHTML = html;

        // 處理卡片連結
        const links = div.querySelectorAll('a.card-link');
        links.forEach(link => {
            const cardId = link.getAttribute('data-card-id');
            const text = link.textContent;
            const card = cards[cardId];

            // 如果文字與卡片標題相同，使用簡短語法
            if (card && text === card.title) {
                link.outerHTML = `[[${cardId}]]`;
            } else {
                link.outerHTML = `[${text}](card://${cardId})`;
            }
        });

        let markdown = div.innerHTML
            .replace(/<strong>([^<]+)<\/strong>/g, '**$1**')
            .replace(/<em>([^<]+)<\/em>/g, '*$1*')
            .replace(/<code>([^<]+)<\/code>/g, '`$1`')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<[^>]+>/g, ''); // 移除其他 HTML 標籤

        return markdown;
    };

    // 初始化編輯器內容
    useEffect(() => {
        if (editorRef.current && !isFocused) {
            const html = markdownToEditableHtml(value);
            if (editorRef.current.innerHTML !== html) {
                editorRef.current.innerHTML = html;
            }
        }
    }, [value, isFocused, cards]);

    // 處理內容變更
    const handleInput = () => {
        if (editorRef.current) {
            const markdown = editableHtmlToMarkdown(editorRef.current.innerHTML);
            onChange?.(markdown);
        }
    };

    // 處理點擊卡片連結
    const handleClick = (e) => {
        const target = e.target;
        if (target.classList.contains('card-link')) {
            e.preventDefault();
            const cardId = target.getAttribute('data-card-id');
            if (cardId && onCardClick) {
                onCardClick(cardId);
            }
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
    };

    useEffect(() => {
        if (autoFocus && editorRef.current) {
            editorRef.current.focus();
        }
    }, [autoFocus]);

    return (
        <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onClick={handleClick}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={className}
            data-placeholder={placeholder}
            suppressContentEditableWarning
            style={{
                minHeight: '100px',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
            }}
        />
    );
};

export default RichTextEditor;
