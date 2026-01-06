// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import { X, Trash2, Link2, Tag as TagIcon, Plus } from 'lucide-react';
// import { useCardStore } from '@/store/useCardStore';
// import MarkdownRenderer from './MarkdownRenderer';
// import ContentContextMenu from './ContentContextMenu';
// import CardDrawer from './CardDrawer';
// import RichTextEditor from './RichTextEditor';
// import {
//     Dialog,
//     DialogContent,
//     DialogHeader,
//     DialogTitle,
// } from '@/components/ui/dialog';
// import {
//     AlertDialog,
//     AlertDialogAction,
//     AlertDialogCancel,
//     AlertDialogContent,
//     AlertDialogDescription,
//     AlertDialogFooter,
//     AlertDialogHeader,
//     AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

// const CardModal = ({ cardId, onClose, onCardClick }) => {
//     const card = useCardStore(state => state.cards[cardId]);
//     const content = useCardStore(state => state.cardContents[cardId]);
//     const loadCardContent = useCardStore(state => state.loadCardContent);
//     const updateCardContent = useCardStore(state => state.updateCardContent);
//     const updateCard = useCardStore(state => state.updateCard);
//     const deleteCard = useCardStore(state => state.deleteCard);
//     const cards = useCardStore(state => state.cards);

//     const [isEditingTitle, setIsEditingTitle] = useState(false);
//     const [isEditingContent, setIsEditingContent] = useState(false);
//     const [editContent, setEditContent] = useState('');
//     const [editTitle, setEditTitle] = useState('');
//     const [showDeleteAlert, setShowDeleteAlert] = useState(false);

//     // 摘要編輯
//     const [isEditingSummary, setIsEditingSummary] = useState(false);
//     const [editSummaryText, setEditSummaryText] = useState('');

//     // Tag 編輯
//     const [isEditingTags, setIsEditingTags] = useState(false);
//     const [editTagsText, setEditTagsText] = useState('');
//     const [newTagInput, setNewTagInput] = useState('');

//     // 內容編輯區的 ref，用於插入連結
//     const contentTextareaRef = useRef(null);

//     // 追蹤 Context Menu 是否開啟，避免 blur 時意外關閉編輯模式
//     const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

//     // Drawer 狀態 - 用於預覽連結的卡片
//     const [drawerCardId, setDrawerCardId] = useState(null);

//     useEffect(() => {
//         if (cardId) {
//             loadCardContent(cardId);
//         }
//     }, [cardId, loadCardContent]);

//     useEffect(() => {
//         if (card) {
//             setEditTitle(card.title);
//             setEditSummaryText(card.summary ? card.summary.join('\n') : '');
//             setEditTagsText(card.tags ? card.tags.join(', ') : '');
//         }
//         if (content !== undefined) {
//             setEditContent(content);
//         }
//     }, [card, content]);

//     if (!card) return null;

//     const saveTitle = () => {
//         if (editTitle.trim() !== card.title) {
//             updateCard(cardId, { title: editTitle });
//         }
//         setIsEditingTitle(false);
//     };

//     const saveContent = () => {
//         // 如果 Context Menu 開啟中，不要儲存並關閉編輯模式
//         if (isContextMenuOpen) return;

//         if (editContent !== content) {
//             updateCardContent(cardId, editContent);
//         }
//         setIsEditingContent(false);
//     };

//     // 插入連結到內容
//     const handleInsertLink = (linkText) => {
//         if (contentTextareaRef.current) {
//             const textarea = contentTextareaRef.current;
//             const start = textarea.selectionStart;
//             const end = textarea.selectionEnd;
//             const newContent = editContent.substring(0, start) + linkText + editContent.substring(end);
//             setEditContent(newContent);

//             setTimeout(() => {
//                 textarea.focus();
//                 textarea.setSelectionRange(start + linkText.length, start + linkText.length);
//             }, 0);
//         } else {
//             setEditContent(prev => prev + '\n' + linkText);
//             setIsEditingContent(true);
//         }
//     };

//     // 從選取內容建立新卡片
//     const handleCreateCardFromSelection = (start, end, linkText, newCardId) => {
//         const newContent = editContent.substring(0, start) + linkText + editContent.substring(end);
//         setEditContent(newContent);

//         // 開啟新卡片的 Drawer 預覽
//         setTimeout(() => {
//             setDrawerCardId(newCardId);
//         }, 100);
//     };

//     // 點擊連結時開啟 Drawer
//     const handleCardLinkClick = (linkedCardId) => {
//         setDrawerCardId(linkedCardId);
//     };

//     // Drawer 導航 - 切換到完整 Modal
//     const handleDrawerNavigate = (targetCardId) => {
//         setDrawerCardId(null);
//         onCardClick?.(targetCardId);
//     };

//     const saveSummary = () => {
//         const newSummary = editSummaryText
//             .split('\n')
//             .map(line => line.trim())
//             .filter(line => line.length > 0);

//         const currentSummaryJSON = JSON.stringify(card.summary || []);
//         const newSummaryJSON = JSON.stringify(newSummary);

//         if (currentSummaryJSON !== newSummaryJSON) {
//             updateCard(cardId, { summary: newSummary });
//         }
//         setIsEditingSummary(false);
//     };

//     // Tag 相關函數
//     const addTag = () => {
//         const trimmedTag = newTagInput.trim();
//         if (trimmedTag && !(card.tags || []).includes(trimmedTag)) {
//             const newTags = [...(card.tags || []), trimmedTag];
//             updateCard(cardId, { tags: newTags });
//             setNewTagInput('');
//         }
//     };

//     const removeTag = (tagToRemove) => {
//         const newTags = (card.tags || []).filter(tag => tag !== tagToRemove);
//         updateCard(cardId, { tags: newTags });
//     };

//     const handleTagKeyDown = (e) => {
//         if (e.key === 'Enter') {
//             e.preventDefault();
//             addTag();
//         }
//     };

//     const handleDeleteClick = () => {
//         setShowDeleteAlert(true);
//     };

//     const confirmDelete = () => {
//         deleteCard(cardId);
//         onClose();
//         setShowDeleteAlert(false);
//     };

//     // 關閉 Modal 前先儲存所有未儲存的內容
//     const handleClose = () => {
//         // 儲存標題
//         if (editTitle.trim() !== card.title) {
//             updateCard(cardId, { title: editTitle });
//         }

//         // 儲存摘要
//         const newSummary = editSummaryText
//             .split('\n')
//             .map(line => line.trim())
//             .filter(line => line.length > 0);
//         const currentSummaryJSON = JSON.stringify(card.summary || []);
//         const newSummaryJSON = JSON.stringify(newSummary);
//         if (currentSummaryJSON !== newSummaryJSON) {
//             updateCard(cardId, { summary: newSummary });
//         }

//         // 儲存內容
//         if (editContent !== content) {
//             updateCardContent(cardId, editContent);
//         }

//         // 關閉 Modal
//         onClose();
//     };

//     // 取得連結到的卡片
//     const linkedCards = card.links
//         .filter(link => !link.isHidden)
//         .map(link => cards[link.targetId])
//         .filter(Boolean);

//     // 取得被連結的卡片
//     const backlinks = Object.values(cards).filter(c =>
//         c.links.some(link => link.targetId === cardId)
//     );

//     return (
//         <>
//             <Dialog open={!!cardId} onOpenChange={handleClose}>
//                 <DialogContent
//                     className="max-w-none w-[60%] h-[80%] resize overflow-auto flex flex-col p-6 bg-white dark:bg-slate-900"
//                     style={{ maxWidth: 'none' }}
//                 >
//                     <DialogHeader className="flex-shrink-0 mr-12">
//                         <div className="flex items-start justify-between gap-4 group/header">
//                             {/* 標題區域 - 帶底線 */}
//                             {isEditingTitle ? (
//                                 <input
//                                     type="text"
//                                     value={editTitle}
//                                     onChange={(e) => setEditTitle(e.target.value)}
//                                     onBlur={saveTitle}
//                                     onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
//                                     className="flex-1 text-2xl font-bold bg-transparent border-b-4 border-primary/40 focus:border-primary outline-none px-1 py-2"
//                                     placeholder="卡片標題"
//                                     autoFocus
//                                 />
//                             ) : (
//                                 <DialogTitle
//                                     className="flex-1 text-2xl font-bold cursor-text border-b-4 border-primary/30 hover:border-primary/50 px-1 py-2 transition-colors"
//                                     onClick={() => setIsEditingTitle(true)}
//                                 >
//                                     {card.title}
//                                 </DialogTitle>
//                             )}

//                             {/* 刪除按鈕 - 懸停顯示 */}
//                             {/* <button
//                                 onClick={handleDeleteClick}
//                                 className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all opacity-0 group-hover/header:opacity-100"
//                                 title="刪除卡片"
//                             >
//                                 <Trash2 className="w-5 h-5 text-red-500" />
//                             </button> */}
//                         </div>

//                         {/* Tag 編輯區域 */}
//                         <div className="flex items-center gap-2 flex-wrap mt-4 px-1">
//                             <TagIcon className="w-4 h-4 text-muted-foreground" />

//                             {/* 現有標籤 */}
//                             {card.tags && card.tags.map((tag, index) => (
//                                 <span
//                                     key={index}
//                                     className="group/tag px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs rounded-full flex items-center gap-1 transition-colors"
//                                 >
//                                     {tag}
//                                     <button
//                                         onClick={() => removeTag(tag)}
//                                         className="opacity-0 group-hover/tag:opacity-100 hover:text-red-500 transition-opacity"
//                                     >
//                                         <X className="w-3 h-3" />
//                                     </button>
//                                 </span>
//                             ))}

//                             {/* 新增標籤輸入 */}
//                             <div className="flex items-center gap-1">
//                                 <input
//                                     type="text"
//                                     value={newTagInput}
//                                     onChange={(e) => setNewTagInput(e.target.value)}
//                                     onKeyDown={handleTagKeyDown}
//                                     placeholder="新增標籤..."
//                                     className="w-24 px-2 py-1 text-xs bg-transparent border border-dashed border-muted-foreground/30 hover:border-primary/50 focus:border-primary rounded-full outline-none transition-colors"
//                                 />
//                                 {newTagInput.trim() && (
//                                     <button
//                                         onClick={addTag}
//                                         className="p-1 hover:bg-primary/10 rounded-full transition-colors"
//                                     >
//                                         <Plus className="w-3 h-3 text-primary" />
//                                     </button>
//                                 )}
//                             </div>
//                         </div>
//                     </DialogHeader>

//                     <div className="flex-1 overflow-y-auto px-1 py-4 space-y-6">
//                         {/* 摘要區域 */}
//                         <div className="space-y-2">
//                             <h3 className="text-sm font-medium text-muted-foreground">摘要</h3>

//                             {isEditingSummary ? (
//                                 <textarea
//                                     value={editSummaryText}
//                                     onChange={(e) => setEditSummaryText(e.target.value)}
//                                     onBlur={saveSummary}
//                                     className="w-full min-h-[100px] p-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl outline-none text-sm resize-y transition-colors"
//                                     placeholder="輸入摘要內容，每一行將作為一個重點顯示在卡片上..."
//                                     autoFocus
//                                 />
//                             ) : (
//                                 <div
//                                     className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl min-h-[80px] cursor-text transition-all whitespace-pre-wrap text-sm"
//                                     onClick={() => setIsEditingSummary(true)}
//                                 >
//                                     {card.summary && card.summary.length > 0 ? (
//                                         <ul className="space-y-1">
//                                             {card.summary.map((item, idx) => (
//                                                 <li key={idx} className="flex items-start gap-2">
//                                                     <span className="text-primary mt-1">•</span>
//                                                     <span>{item}</span>
//                                                 </li>
//                                             ))}
//                                         </ul>
//                                     ) : (
//                                         <p className="text-muted-foreground italic">點擊輸入摘要...</p>
//                                     )}
//                                 </div>
//                             )}
//                         </div>

//                         {/* 內容區域 */}
//                         <div className="space-y-2 flex-1 flex flex-col">
//                             <h3 className="text-sm font-medium text-muted-foreground">內容</h3>
//                             {isEditingContent ? (
//                                 <ContentContextMenu
//                                     currentCardId={cardId}
//                                     onInsertLink={handleInsertLink}
//                                     onOpenChange={setIsContextMenuOpen}
//                                     onCreateCardFromSelection={handleCreateCardFromSelection}
//                                     textareaRef={contentTextareaRef}
//                                 >
//                                     <textarea
//                                         ref={contentTextareaRef}
//                                         value={editContent}
//                                         onChange={(e) => setEditContent(e.target.value)}
//                                         onBlur={saveContent}
//                                         className="w-full flex-1 min-h-[300px] p-4 bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-primary rounded-xl outline-none font-mono text-sm resize-none transition-colors"
//                                         placeholder="支援 Markdown 格式&#10;&#10;右鍵可插入卡片連結或從選取建立新卡片"
//                                         autoFocus
//                                     />
//                                 </ContentContextMenu>
//                             ) : (
//                                 <div
//                                     className="p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 rounded-xl min-h-[200px] cursor-text transition-all"
//                                     onClick={() => setIsEditingContent(true)}
//                                 >
//                                     {content ? (
//                                         <MarkdownRenderer
//                                             content={content}
//                                             onCardClick={handleCardLinkClick}
//                                         />
//                                     ) : (
//                                         <p className="text-muted-foreground text-sm">點擊此處開始編輯內容...</p>
//                                     )}
//                                 </div>
//                             )}
//                         </div>

//                         {/* 連結資訊 */}
//                         <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
//                             {/* 連結到 */}
//                             <div className="space-y-2">
//                                 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
//                                     <Link2 className="w-4 h-4" />
//                                     <span>連結到 ({linkedCards.length})</span>
//                                 </div>
//                                 {linkedCards.length > 0 ? (
//                                     <div className="space-y-1">
//                                         {linkedCards.map(linkedCard => (
//                                             <button
//                                                 key={linkedCard.id}
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     onCardClick(linkedCard.id);
//                                                 }}
//                                                 className="block w-full text-left px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
//                                             >
//                                                 {linkedCard.title}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 ) : (
//                                     <p className="text-sm text-muted-foreground">無連結</p>
//                                 )}
//                             </div>

//                             {/* 被連結 */}
//                             <div className="space-y-2">
//                                 <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
//                                     <Link2 className="w-4 h-4 rotate-180" />
//                                     <span>被連結 ({backlinks.length})</span>
//                                 </div>
//                                 {backlinks.length > 0 ? (
//                                     <div className="space-y-1">
//                                         {backlinks.map(backlinkCard => (
//                                             <button
//                                                 key={backlinkCard.id}
//                                                 onClick={(e) => {
//                                                     e.stopPropagation();
//                                                     onCardClick(backlinkCard.id);
//                                                 }}
//                                                 className="block w-full text-left px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-sm transition-colors"
//                                             >
//                                                 {backlinkCard.title}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 ) : (
//                                     <p className="text-sm text-muted-foreground">無反向連結</p>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </DialogContent>
//             </Dialog>

//             <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
//                 <AlertDialogContent>
//                     <AlertDialogHeader>
//                         <AlertDialogTitle>確定要刪除這張卡片嗎？</AlertDialogTitle>
//                         <AlertDialogDescription>
//                             此操作無法復原。卡片將被永久刪除。
//                         </AlertDialogDescription>
//                     </AlertDialogHeader>
//                     <AlertDialogFooter>
//                         <AlertDialogCancel>取消</AlertDialogCancel>
//                         <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
//                             確定刪除
//                         </AlertDialogAction>
//                     </AlertDialogFooter>
//                 </AlertDialogContent>
//             </AlertDialog>

//             {/* 卡片預覽 Drawer */}
//             <CardDrawer
//                 cardId={drawerCardId}
//                 open={!!drawerCardId}
//                 onOpenChange={(open) => !open && setDrawerCardId(null)}
//                 onNavigate={handleDrawerNavigate}
//             />
//         </>
//     );
// };

// export default CardModal;
