// 初始化測試資料的函數
export function initializeSampleData(useCardStore) {
    const { cards, addCard, updateCardContent } = useCardStore.getState();

    // 如果已有卡片，不要覆蓋
    if (Object.keys(cards).length > 0) {
        console.log('已有卡片資料，跳過初始化');
        return;
    }

}
