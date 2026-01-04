// 測試用的初始卡片資料
// 可以用來快速測試卡片系統功能

export const sampleCards = [
    {
        id: 'card-sample-1',
        title: 'AI 基礎概念',
        summary: [
            '機器學習基本原理',
            '監督式與非監督式學習',
            '深度學習簡介'
        ],
        tags: ['AI', '基礎'],
        color: '#3b82f6',
        position: { x: 100, y: 100, z: 0 },
        links: [
            {
                targetId: 'card-sample-2',
                type: 'prerequisite',
                label: '前置知識',
                isHidden: false
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'card-sample-2',
        title: 'Python 程式設計',
        summary: [
            '基本語法',
            '資料結構',
            'NumPy 與 Pandas'
        ],
        tags: ['Python', '程式設計'],
        color: '#10b981',
        position: { x: 400, y: 100, z: 0 },
        links: [
            {
                targetId: 'card-sample-3',
                type: 'reference',
                label: '相關主題',
                isHidden: false
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'card-sample-3',
        title: '機器學習實作',
        summary: [
            'Scikit-learn 使用',
            '模型訓練與評估',
            '特徵工程'
        ],
        tags: ['Machine Learning', 'Python'],
        color: '#a855f7',
        position: { x: 700, y: 100, z: 0 },
        links: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const sampleContents = {
    'card-sample-1': `# AI 基礎概念

## 什麼是人工智慧？

人工智慧（Artificial Intelligence, AI）是讓機器模擬人類智慧的技術。

## 機器學習

機器學習是 AI 的一個分支，讓電腦從資料中學習，而不需要明確編程。

### 監督式學習
- 使用標記資料訓練模型
- 例如：分類、回歸

### 非監督式學習
- 從未標記資料中發現模式
- 例如：聚類、降維

## 深度學習

深度學習使用神經網路來處理複雜的問題。

相關主題：[[card-sample-2]]
`,
    'card-sample-2': `# Python 程式設計

## 為什麼選擇 Python？

Python 是 AI 和機器學習領域最受歡迎的程式語言。

## 基本語法

\`\`\`python
# 變數宣告
name = "AI Learner"
age = 25

# 函數定義
def greet(name):
    return f"Hello, {name}!"

print(greet(name))
\`\`\`

## 重要套件

### NumPy
用於數值計算和陣列操作。

### Pandas
用於資料分析和處理。

### Matplotlib
用於資料視覺化。

下一步：[機器學習實作](card://card-sample-3)
`,
    'card-sample-3': `# 機器學習實作

## Scikit-learn 簡介

Scikit-learn 是 Python 最受歡迎的機器學習函式庫。

## 基本流程

1. **資料準備**
   - 載入資料
   - 資料清理
   - 特徵選擇

2. **模型訓練**
   \`\`\`python
   from sklearn.linear_model import LogisticRegression
   
   model = LogisticRegression()
   model.fit(X_train, y_train)
   \`\`\`

3. **模型評估**
   - 準確率
   - 精確率
   - 召回率

## 特徵工程

特徵工程是提升模型效能的關鍵。

- 特徵縮放
- 特徵編碼
- 特徵選擇

前置知識：[[card-sample-1]] 和 [[card-sample-2]]
`
};

// 初始化測試資料的函數
export function initializeSampleData(useCardStore) {
    const { cards, addCard, updateCardContent } = useCardStore.getState();

    // 如果已有卡片，不要覆蓋
    if (Object.keys(cards).length > 0) {
        console.log('已有卡片資料，跳過初始化');
        return;
    }

    // 新增範例卡片
    sampleCards.forEach(card => {
        addCard(card);
    });

    // 新增範例內容
    Object.entries(sampleContents).forEach(([cardId, content]) => {
        updateCardContent(cardId, content);
    });

    console.log('✅ 已載入範例資料：3 張卡片');
}
