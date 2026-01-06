'use client';

import { useState, useRef, useEffect } from 'react';
import { useCardStore } from '@/store/useCardStore';

/**
 * 卡片內容編輯器
 * 支援卡片連結的特殊處理
 */
const CardContentEditor = ({
    value,
    onChange,
    onBlur,
    onCardClick,
    placeholder = '開始輸入...',
    className = '',
    autoFocus = false
}) => {
    const editorRef = useRef(null);
    const cards = useCardStore(state => state.cards);
    const [isFocused, setIsFocused] = useState(false);

    // 解析 Markdown 中的卡片連結：[[card:id|顯示文字]] 或 [[card:id]]
    const parseCardLinks = (text) => {
        if (!text) return '';

        return text.replace(
            /\[\[card:([^\]|]+)(?:\|([^\]]+))?\]\]/g,
            (match, cardId, displayText) => {
                const card = cards[cardId];
                const display = displayText || card?.title || cardId;
                // 使用 data 屬性存儲 ID，不顯示在文字中
                return `<span class="card-link-tag" data-card-id="${cardId}" contenteditable="false">${display}</span>`;
            }
        );
    };

    // 將 HTML 轉回 Markdown
    const toMarkdown = (html) => {
        if (!html) return '';

        const div = document.createElement('div');
        div.innerHTML = html;

        // 處理卡片連結標籤
        const links = div.querySelectorAll('.card-link-tag');
        links.forEach(link => {
            const cardId = link.getAttribute('data-card-id');
            const displayText = link.textContent;
            const card = cards[cardId];

            // 如果顯示文字與卡片標題相同，使用簡短格式
            if (card && displayText === card.title) {
                link.outerHTML = `[[card:${cardId}]]`;
            } else {
                link.outerHTML = `[[card:${cardId}|${displayText}]]`;
            }
        });

        return div.innerHTML
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<div>/g, '\n')
            .replace(/<\/div>/g, '')
            .replace(/<[^>]+>/g, ''); // 移除其他 HTML 標籤
    };

    // 初始化和更新編輯器內容
    useEffect(() => {
        if (editorRef.current && !isFocused) {
            const html = parseCardLinks(value);
            if (editorRef.current.innerHTML !== html) {
                editorRef.current.innerHTML = html;
            }
        }
    }, [value, isFocused, cards]);

    const handleInput = () => {
        if (editorRef.current) {
            const markdown = toMarkdown(editorRef.current.innerHTML);
            onChange?.(markdown);
        }
    };

    const handleClick = (e) => {
        const target = e.target;
        if (target.classList.contains('card-link-tag')) {
            e.preventDefault();
            e.stopPropagation();
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

export default CardContentEditor;
