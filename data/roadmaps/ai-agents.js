// AI Agents 完整學習路線圖 - 基於 roadmap.sh 2025
export const aiAgentsRoadmap = {
  id: 'ai-agents',
  title: 'AI Agents',
  description: '學習設計、建構與部署 AI Agents - 完整版',
  icon: '🤖',
  nodes: [
    // ============ FOUNDATION ============
    {
      id: '1',
      type: 'custom',
      data: {
        label: '前置條件',
        subtitle: 'Pre-requisites',
        category: 'foundation',
        description: '開始學習前的必備技能',
        content: `在開始 AI Agents 之前,你應該具備:
- **Git & Version Control**: 版本控制基礎
- **Terminal/Command Line**: 命令列操作
- **Backend Development Basics**: 後端開發基礎
- **REST API Knowledge**: REST API 概念與使用
- **Basic Python Programming**: Python 基礎程式設計`,
        resources: [
          { title: 'Backend Beginner Roadmap', url: 'https://roadmap.sh/backend' },
          { title: 'Git and GitHub Roadmap', url: 'https://roadmap.sh/git-github' },
          { title: 'API Design Roadmap', url: 'https://roadmap.sh/api-design' }
        ]
      },
      position: { x: 400, y: 0 }
    },

    // ============ LLM FUNDAMENTALS ============
    {
      id: '2',
      type: 'custom',
      data: {
        label: 'LLM 基礎',
        subtitle: 'LLM Fundamentals',
        category: 'core',
        description: '理解大型語言模型的基礎',
        content: `深入了解 LLM 的核心概念:
- **Transformer Models**: Transformer 架構原理
- **Tokenization**: 文本分詞機制
- **Context Windows**: 上下文窗口限制
- **Embeddings**: 向量嵌入技術
- **Model Mechanisms**: 模型運作機制`,
        resources: [
          { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
          { title: 'OpenAI Tokenizer', url: 'https://platform.openai.com/tokenizer' }
        ]
      },
      position: { x: 400, y: 120 }
    },

    {
      id: '3',
      type: 'custom',
      data: {
        label: '生成控制',
        subtitle: 'Generation Controls',
        category: 'core',
        description: '控制 LLM 生成行為',
        content: `掌握 LLM 生成參數:
- **Temperature**: 控制輸出隨機性 (0.0-2.0)
- **Top-p (Nucleus Sampling)**: 累積機率採樣
- **Frequency Penalty**: 降低重複詞彙
- **Presence Penalty**: 鼓勵新主題
- **Max Length**: 最大生成長度
- **Stopping Criteria**: 停止條件設定`,
        resources: [
          { title: 'OpenAI API Parameters', url: 'https://platform.openai.com/docs/api-reference/chat' }
        ]
      },
      position: { x: 200, y: 240 }
    },

    {
      id: '4',
      type: 'custom',
      data: {
        label: '模型家族與定價',
        subtitle: 'Model Families & Pricing',
        category: 'core',
        description: '認識不同的模型類型',
        content: `了解模型生態系統:
- **Open Weight Models**: Llama, Mistral, Qwen
- **Closed Weight Models**: GPT-4, Claude, Gemini
- **Reasoning vs Standard Models**: o1 vs GPT-4
- **Streamed vs Unstreamed Responses**: 串流回應差異
- **Token-Based Pricing**: 基於 token 的計費
- **Fine-tuning vs Prompt Engineering**: 何時該用哪種方法`,
        resources: [
          { title: 'Model Pricing Comparison', url: 'https://openrouter.ai/models' }
        ]
      },
      position: { x: 600, y: 240 }
    },

    // ============ RAG BASICS ============
    {
      id: '5',
      type: 'custom',
      data: {
        label: 'RAG 基礎',
        subtitle: 'RAG Basics',
        category: 'core',
        description: '檢索增強生成基礎',
        content: `理解 RAG 系統:
- **Embeddings**: 文本向量化
- **Vector Databases**: Pinecone, Weaviate, Chroma
- **Semantic Search**: 語義搜索
- **Chunking Strategies**: 文本切割策略
- **Retrieval Methods**: 檢索方法 (Dense, Sparse, Hybrid)`,
        resources: [
          { title: 'Vector Database Comparison', url: 'https://github.com/langchain-ai/langchain/discussions' }
        ]
      },
      position: { x: 400, y: 360 }
    },

    // ============ AI AGENTS 101 ============
    {
      id: '6',
      type: 'custom',
      data: {
        label: '什麼是 AI Agents？',
        subtitle: 'What are AI Agents?',
        category: 'core',
        description: 'AI Agents 入門',
        content: `AI Agents 的核心概念:
- **Autonomous Systems**: 可自主決策的系統
- **Perceive, Reason, Act**: 感知、推理、行動循環
- **Goal-Oriented Behavior**: 目標導向行為
- **Tool Use**: 工具使用能力
- **Memory & Learning**: 記憶與學習機制`,
        resources: [
          { title: 'LangChain Agents Guide', url: 'https://python.langchain.com/docs/modules/agents/' }
        ]
      },
      position: { x: 400, y: 480 }
    },

    {
      id: '7',
      type: 'custom',
      data: {
        label: 'Agent 循環',
        subtitle: 'Agent Loop',
        category: 'core',
        description: 'Agent 的核心循環',
        content: `Agent Loop 的四個階段:
1. **Perception / User Input**: 接收用戶輸入
2. **Reason and Plan**: 分析並制定計劃
3. **Acting / Tool Invocation**: 執行工具與動作
4. **Observation & Reflection**: 觀察結果並反思`,
        resources: [
          { title: 'ReAct Pattern Paper', url: 'https://arxiv.org/abs/2210.03629' }
        ]
      },
      position: { x: 400, y: 600 }
    },

    {
      id: '8',
      type: 'custom',
      data: {
        label: '應用案例',
        subtitle: 'Example Use Cases',
        category: 'core',
        description: 'AI Agents 應用場景',
        content: `常見的 AI Agent 應用:
- **Personal Assistant**: 個人助理
- **Code Generation**: 程式碼生成與除錯
- **Data Analysis**: 數據分析與報告
- **Web Scraping/Crawling**: 網頁爬取
- **NPC/Game AI**: 遊戲 AI 角色`,
        resources: []
      },
      position: { x: 400, y: 720 }
    },

    // ============ PROMPT ENGINEERING ============
    {
      id: '9',
      type: 'custom',
      data: {
        label: '提示工程',
        subtitle: 'Prompt Engineering',
        category: 'skill',
        description: '提示工程技巧',
        content: `撰寫有效 Prompt 的原則:
- **Be Specific**: 明確說明你要什麼
- **Provide Context**: 提供充足的上下文
- **Use Examples**: 使用範例 (Few-shot Learning)
- **Specify Format**: 指定輸出格式
- **Iterate and Test**: 迭代與測試
- **Use Technical Terms**: 使用相關術語`,
        resources: [
          { title: 'Prompt Engineering Roadmap', url: 'https://roadmap.sh/prompt-engineering' },
          { title: 'OpenAI Prompt Guide', url: 'https://platform.openai.com/docs/guides/prompt-engineering' }
        ]
      },
      position: { x: 200, y: 840 }
    },

    // ============ TOOLS & ACTIONS ============
    {
      id: '10',
      type: 'custom',
      data: {
        label: '工具與動作',
        subtitle: 'Tools & Actions',
        category: 'skill',
        description: 'Agent 工具定義與使用',
        content: `Tool Definition 包含:
- **Name and Description**: 工具名稱與描述
- **Input/Output Schema**: 輸入輸出結構
- **Error Handling**: 錯誤處理機制
- **Usage Examples**: 使用範例

常見工具類型:
- Web Search, Code Execution, Database Queries
- API Requests, Email/Slack/SMS
- File System Access`,
        resources: [
          { title: 'LangChain Tools', url: 'https://python.langchain.com/docs/modules/tools/' }
        ]
      },
      position: { x: 600, y: 840 }
    },

    // ============ AGENT MEMORY ============
    {
      id: '11',
      type: 'custom',
      data: {
        label: 'Agent 記憶',
        subtitle: 'Agent Memory',
        category: 'advanced',
        description: 'Agent 記憶系統',
        content: `Memory 系統設計:
- **Short Term Memory**: Conversation Buffer
- **Long Term Memory**: Vector DB / SQL
- **Episodic vs Semantic Memory**: 情節記憶 vs 語義記憶
- **Summarization/Compression**: 摘要與壓縮
- **Forgetting/Aging Strategies**: 遺忘機制
- **User Profile Storage**: 用戶資料儲存`,
        resources: [
          { title: 'Memory in LangChain', url: 'https://python.langchain.com/docs/modules/memory/' }
        ]
      },
      position: { x: 200, y: 960 }
    },

    // ============ AGENT ARCHITECTURES ============
    {
      id: '12',
      type: 'custom',
      data: {
        label: 'Agent 架構',
        subtitle: 'Agent Architectures',
        category: 'advanced',
        description: 'Agent 架構模式',
        content: `常見的 Agent 架構:
- **ReAct (Reason + Act)**: 推理與行動結合
- **Chain of Thought (CoT)**: 思維鏈
- **RAG Agent**: 檢索增強 Agent
- **Planner-Executor**: 規劃者-執行者
- **Tree-of-Thought**: 思維樹
- **DAG Agents**: 有向無環圖 Agent
- **Model Context Protocol (MCP)**: 上下文協議`,
        resources: [
          { title: 'ReAct Paper', url: 'https://arxiv.org/abs/2210.03629' }
        ]
      },
      position: { x: 600, y: 960 }
    },

    // ============ BUILDING AGENTS ============
    {
      id: '13',
      type: 'custom',
      data: {
        label: '從零建構',
        subtitle: 'Building from Scratch',
        category: 'advanced',
        description: '手動建構 Agent',
        content: `從零開始建構 Agent:
- **Direct LLM API Calls**: 直接呼叫 LLM API
- **Implementing Agent Loop**: 實作 Agent 循環
- **Parsing Model Output**: 解析模型輸出
- **Error & Rate-limit Handling**: 錯誤與速率限制處理
- **State Management**: 狀態管理`,
        resources: []
      },
      position: { x: 200, y: 1080 }
    },

    {
      id: '14',
      type: 'custom',
      data: {
        label: 'LLM 原生函數呼叫',
        subtitle: 'LLM Native Function Calling',
        category: 'advanced',
        description: 'LLM 原生函數呼叫',
        content: `使用 LLM 的原生工具:
- **OpenAI Function Calling**: OpenAI 函數呼叫
- **Gemini Function Calling**: Gemini 工具使用
- **Anthropic Tool Use**: Claude 工具使用
- **OpenAI Assistant API**: 助理 API`,
        resources: [
          { title: 'OpenAI Function Calling', url: 'https://platform.openai.com/docs/guides/function-calling' }
        ]
      },
      position: { x: 400, y: 1080 }
    },

    {
      id: '15',
      type: 'custom',
      data: {
        label: 'Agent 框架',
        subtitle: 'Agent Frameworks',
        category: 'advanced',
        description: '使用框架建構 Agent',
        content: `主流 Agent 框架:
- **LangChain**: 最成熟的框架,豐富的整合
- **LlamaIndex**: 專注於資料檢索與索引
- **Haystack**: 專注於 NLP pipeline
- **AutoGen**: Microsoft 的多 Agent 框架
- **CrewAI**: Multi-agent 協作
- **Smol Depot**: 輕量級框架`,
        resources: [
          { title: 'LangChain', url: 'https://langchain.com' },
          { title: 'CrewAI', url: 'https://www.crewai.com/' },
          { title: 'AutoGen', url: 'https://microsoft.github.io/autogen/' }
        ]
      },
      position: { x: 600, y: 1080 }
    },

    // ============ TESTING & EVALUATION ============
    {
      id: '16',
      type: 'custom',
      data: {
        label: '評估與測試',
        subtitle: 'Evaluation & Testing',
        category: 'production',
        description: 'Agent 評估與測試',
        content: `測試與評估策略:
- **Metrics to Track**: 追蹤指標 (準確率、延遲、成本)
- **Unit Testing**: 個別工具的單元測試
- **Integration Testing**: 流程整合測試
- **Human-in-the-Loop**: 人工參與評估

評估框架:
- **LangSmith**: LangChain 官方工具
- **Ragas**: RAG 評估框架
- **DeepEval**: 全面評估工具`,
        resources: [
          { title: 'LangSmith', url: 'https://www.langchain.com/langsmith' }
        ]
      },
      position: { x: 200, y: 1200 }
    },

    {
      id: '17',
      type: 'custom',
      data: {
        label: '除錯與監控',
        subtitle: 'Debugging & Monitoring',
        category: 'production',
        description: 'Agent 除錯與監控',
        content: `Observability 工具:
- **Structured Logging & Tracing**: 結構化日誌與追蹤
- **LangSmith**: 完整的 Agent 監控
- **Helicone**: LLM 請求監控
- **LangFuse**: 開源監控工具
- **OpenLLMetry**: OpenTelemetry for LLMs`,
        resources: [
          { title: 'LangSmith', url: 'https://smith.langchain.com' },
          { title: 'Helicone', url: 'https://www.helicone.ai/' }
        ]
      },
      position: { x: 600, y: 1200 }
    },

    // ============ SECURITY & ETHICS ============
    {
      id: '18',
      type: 'custom',
      data: {
        label: '安全與倫理',
        subtitle: 'Security & Ethics',
        category: 'production',
        description: '安全性與倫理考量',
        content: `安全與倫理重點:
- **Prompt Injection/Jailbreaks**: 防範 Prompt 注入
- **Tool Sandboxing**: 工具沙箱隔離
- **Permissioning**: 權限管理
- **Data Privacy + PII Redaction**: 資料隱私與 PII 遮蔽
- **Bias & Toxicity Guardrails**: 偏見與有害內容防護
- **Safety + Red Team Testing**: 安全性與紅隊測試`,
        resources: []
      },
      position: { x: 400, y: 1320 }
    },

    // ============ ADVANCED TOPICS ============
    {
      id: '19',
      type: 'custom',
      data: {
        label: '多 Agent 系統',
        subtitle: 'Multi-Agent Systems',
        category: 'advanced',
        description: '多 Agent 協作系統',
        content: `Multi-Agent 系統設計:
- **Agent Communication**: Agent 間通訊協議
- **Task Distribution**: 任務分配策略
- **Coordination Patterns**: 協調模式
- **Hierarchical Agents**: 階層式 Agent
- **Swarm Intelligence**: 群體智慧`,
        resources: [
          { title: 'AutoGen Multi-Agent', url: 'https://microsoft.github.io/autogen/' }
        ]
      },
      position: { x: 200, y: 1440 }
    },

    {
      id: '20',
      type: 'custom',
      data: {
        label: '進階 RAG',
        subtitle: 'Advanced RAG',
        category: 'advanced',
        description: '進階 RAG 技術',
        content: `進階 RAG 技巧:
- **Hybrid Search**: Dense + Sparse retrieval
- **Re-ranking**: 重新排序檢索結果
- **Query Rewriting**: 查詢改寫
- **Metadata Filtering**: 元數據過濾
- **Graph RAG**: 基於圖的 RAG
- **Agentic RAG**: Agent 驅動的 RAG`,
        resources: []
      },
      position: { x: 600, y: 1440 }
    },

    // ============ DEPLOYMENT ============
    {
      id: '21',
      type: 'custom',
      data: {
        label: '生產部署',
        subtitle: 'Production Deployment',
        category: 'production',
        description: '生產環境部署',
        content: `部署考量:
- **Scalability**: 可擴展性設計
- **Cost Optimization**: 成本優化
- **Latency Management**: 延遲管理
- **Caching Strategies**: 快取策略
- **Load Balancing**: 負載平衡
- **Fallback Mechanisms**: 降級機制
- **A/B Testing**: A/B 測試`,
        resources: []
      },
      position: { x: 400, y: 1560 }
    }
  ],

  edges: [
    // Foundation to Core
    { id: 'e1-2', source: '1', target: '2', animated: true, type: 'smoothstep' },

    // LLM Fundamentals branches
    { id: 'e2-3', source: '2', target: '3', animated: true, type: 'smoothstep' },
    { id: 'e2-4', source: '2', target: '4', animated: true, type: 'smoothstep' },
    { id: 'e2-5', source: '2', target: '5', animated: true, type: 'smoothstep' },

    // Converge to AI Agents 101
    { id: 'e3-6', source: '3', target: '6', animated: true, type: 'smoothstep' },
    { id: 'e4-6', source: '4', target: '6', animated: true, type: 'smoothstep' },
    { id: 'e5-6', source: '5', target: '6', animated: true, type: 'smoothstep' },

    // Agent basics
    { id: 'e6-7', source: '6', target: '7', animated: true, type: 'smoothstep' },
    { id: 'e7-8', source: '7', target: '8', animated: true, type: 'smoothstep' },

    // Skills branch
    { id: 'e8-9', source: '8', target: '9', animated: true, type: 'smoothstep' },
    { id: 'e8-10', source: '8', target: '10', animated: true, type: 'smoothstep' },

    // Advanced concepts
    { id: 'e9-11', source: '9', target: '11', animated: true, type: 'smoothstep' },
    { id: 'e10-12', source: '10', target: '12', animated: true, type: 'smoothstep' },

    // Building approaches
    { id: 'e11-13', source: '11', target: '13', animated: true, type: 'smoothstep' },
    { id: 'e12-13', source: '12', target: '13', animated: true, type: 'smoothstep' },
    { id: 'e12-14', source: '12', target: '14', animated: true, type: 'smoothstep' },
    { id: 'e12-15', source: '12', target: '15', animated: true, type: 'smoothstep' },

    // Testing & Production
    { id: 'e13-16', source: '13', target: '16', animated: true, type: 'smoothstep' },
    { id: 'e14-16', source: '14', target: '16', animated: true, type: 'smoothstep' },
    { id: 'e15-17', source: '15', target: '17', animated: true, type: 'smoothstep' },

    // Security
    { id: 'e16-18', source: '16', target: '18', animated: true, type: 'smoothstep' },
    { id: 'e17-18', source: '17', target: '18', animated: true, type: 'smoothstep' },

    // Advanced topics
    { id: 'e15-19', source: '15', target: '19', animated: true, type: 'smoothstep' },
    { id: 'e15-20', source: '15', target: '20', animated: true, type: 'smoothstep' },

    // Final deployment
    { id: 'e18-21', source: '18', target: '21', animated: true, type: 'smoothstep' },
    { id: 'e19-21', source: '19', target: '21', animated: true, type: 'smoothstep' },
    { id: 'e20-21', source: '20', target: '21', animated: true, type: 'smoothstep' }
  ],

  categoryColors: {
    foundation: {
      bg: 'rgba(251, 191, 36, 0.1)',
      border: '#fbbf24',
      text: '#fbbf24'
    },
    core: {
      bg: 'rgba(59, 130, 246, 0.1)',
      border: '#3b82f6',
      text: '#3b82f6'
    },
    skill: {
      bg: 'rgba(16, 185, 129, 0.1)',
      border: '#10b981',
      text: '#10b981'
    },
    advanced: {
      bg: 'rgba(168, 85, 247, 0.1)',
      border: '#a855f7',
      text: '#a855f7'
    },
    production: {
      bg: 'rgba(236, 72, 153, 0.1)',
      border: '#ec4899',
      text: '#ec4899'
    }
  }
};
