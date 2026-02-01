export const aiAgentsRoadmap = {
    "id": "ai-agents",
    "title": "AI Agents 完整學習路線",
    "description": "從零到生產部署 - 整合實戰經驗版",
    "icon": "🤖",
    "nodes": [
        {
            "id": "1",
            "type": "custom",
            "data": {
                "label": "前置條件",
                "subtitle": "Pre-requisites",
                "category": "foundation",
                "description": "開始學習前的必備技能",
                "content": "**必備技能**\n- Git & Version Control (版本控制)\n- Terminal/Command Line (命令列操作)\n- Backend Development Basics (後端開發基礎)\n- REST API Knowledge (REST API 概念)\n- Basic Python Programming (Python 基礎)\n\n**你的優勢**\n作為 C# 全端工程師，你已具備大部分技能，只需補強 Python 基礎即可。\n\n**學習時間**: 1-2 週 Python 基礎",
                "resources": [
                    { "title": "Backend Roadmap", "url": "https://roadmap.sh/backend" },
                    { "title": "Python 官方教學", "url": "https://docs.python.org/zh-tw/3/tutorial/" }
                ]
            },
            "position": { "x": 400, "y": 0 }
        },
        {
            "id": "2",
            "type": "custom",
            "data": {
                "label": "LLM 基礎",
                "subtitle": "LLM Fundamentals",
                "category": "core",
                "description": "理解大型語言模型運作原理",
                "content": "**核心概念**\n\n**Transformer 架構**\n- Self-Attention: 計算詞彙間關聯性\n- Multi-Head Attention: 多頭注意力機制\n- Position Encoding: 位置編碼\n\n**Tokenization (分詞)**\n- 文本 → Token 序列\n- 影響成本與 Context Window\n- 工具: OpenAI Tokenizer\n\n**Context Windows**\n- GPT-3.5: 4K tokens\n- GPT-4: 8K-128K tokens\n- Llama3: 8K tokens\n- Claude 3: 200K tokens\n\n**Embeddings (向量嵌入)**\n- 將文字轉為數學向量\n- 相似文字 → 相似向量\n- 向量資料庫的基礎\n\n**學習時間**: 1-2 週",
                "resources": [
                    { "title": "Attention Is All You Need", "url": "https://arxiv.org/abs/1706.03762" },
                    { "title": "OpenAI Tokenizer", "url": "https://platform.openai.com/tokenizer" }
                ]
            },
            "position": { "x": 400, "y": 150 }
        },
        {
            "id": "3",
            "type": "custom",
            "data": {
                "label": "生成控制",
                "subtitle": "Generation Controls",
                "category": "core",
                "description": "控制 LLM 生成行為的參數",
                "content": "**核心參數**\n\n**Temperature (溫度)**\n- 0.0: 確定性最高 (程式碼生成)\n- 0.7: 平衡創造力 (一般對話)\n- 1.0+: 高創造性 (創意寫作)\n\n**Top-p (Nucleus Sampling)**\n- 0.9: 從累積機率 90% 的詞彙中選擇\n- 控制輸出多樣性\n\n**Frequency Penalty**\n- 降低重複詞彙出現機率\n- 範圍: -2.0 到 2.0\n\n**Presence Penalty**\n- 鼓勵引入新主題\n- 避免內容重複\n\n**Max Tokens**\n- 限制生成長度\n- 控制成本\n\n**實戰技巧**\n- PPT 生成: Temperature 0.3 (結構穩定)\n- 程式碼: Temperature 0.0 (精確)\n- 創意文案: Temperature 0.8-1.2\n\n**學習時間**: 3-5 天實驗",
                "resources": [
                    { "title": "OpenAI API Parameters", "url": "https://platform.openai.com/docs/api-reference/chat" }
                ]
            },
            "position": { "x": 200, "y": 300 }
        },
        {
            "id": "4",
            "type": "custom",
            "data": {
                "label": "模型家族與定價",
                "subtitle": "Model Families & Pricing",
                "category": "core",
                "description": "認識不同模型類型與成本",
                "content": "**開源模型 (Open Weight)**\n- Llama 3.2 (3B-70B): Meta 出品，平衡\n- Mistral-Nemo (12B): 多語言、程式碼強\n- Phi-3 (3.8B): Microsoft，速度快\n-  Qwen (7B-72B): 中文強但有政治審查\n\n**商業模型 (Closed Weight)**\n- GPT-4: $5/$15 per 1M tokens\n- Claude 3.5: $3/$15 per 1M tokens\n- Gemini 1.5: $1.25/$5 per 1M tokens\n\n**Reasoning vs Standard**\n- o1 系列: 深度推理，慢但準\n- GPT-4: 快速回應，通用\n\n**選擇原則**\n- 內網部署 → 開源模型 (Ollama)\n- 高品質需求 → GPT-4/Claude\n- 成本敏感 → Gemini/開源\n\n**Fine-tuning vs Prompt Engineering**\n- Prompt: 0 成本，1 天\n- LoRA 微調: 0 成本 (Colab)，1 週\n- Full Fine-tuning: $100+，1 個月\n\n**學習時間**: 2-3 天",
                "resources": [
                    { "title": "OpenRouter 價格比較", "url": "https://openrouter.ai/models" },
                    { "title": "Hugging Face 模型庫", "url": "https://huggingface.co/models" }
                ]
            },
            "position": { "x": 600, "y": 300 }
        },
        {
            "id": "5",
            "type": "custom",
            "data": {
                "label": "RAG 基礎",
                "subtitle": "RAG Basics",
                "category": "core",
                "description": "檢索增強生成基礎",
                "content": "**為什麼需要 RAG？**\n\nLLM 的限制:\n-  不知道公司內部文件\n-  不知道最新資訊\n-  無法客製化知識\n\n**RAG 完整流程**\n``````\n\n**核心組件**\n\n**Embeddings (向量嵌入)**\n- 將文字轉為數學向量\n- OpenAI: text-embedding-3-small (1536維)\n- 開源: sentence-transformers\n\n**Vector Databases**\n- Chroma: 個人學習，零配置\n- Qdrant: 內網部署，高效能\n- Pinecone: 雲端，免維護\n- Milvus: 企業級，億級資料\n\n**Chunking (文本切割)**\n- 固定長度: 500 字 + 50 字重疊\n- 語義切割: 按段落/句號切\n- 推薦: RecursiveCharacterTextSplitter\n\n**Retrieval Methods**\n- Dense Search: 向量相似度\n- Sparse Search: 關鍵字匹配\n- Hybrid: 結合兩者\n\n**30 分鐘實作 RAG**\n``````\n\n**學習時間**: 1 週",
                "resources": [
                    { "title": "Chroma 文件", "url": "https://docs.trychroma.com/" },
                    { "title": "Qdrant 快速開始", "url": "https://qdrant.tech/documentation/quick-start/" }
                ]
            },
            "position": { "x": 400, "y": 450 }
        },
        {
            "id": "6",
            "type": "custom",
            "data": {
                "label": "什麼是 AI Agents？",
                "subtitle": "What are AI Agents?",
                "category": "core",
                "description": "AI Agents 核心概念",
                "content": "**定義**\nAI Agent 是能**自主感知、推理、決策並執行動作**的系統。\n\n**圖書館比喻**\n\n傳統 LLM:\n``````\n\nAI Agent:\n``````\n\n**核心能力**\n\n**1. Perception (感知)**\n- 接收用戶輸入\n- 感知環境狀態\n- 檢測系統資訊\n\n**2. Reason (推理)**\n- 分析問題\n- 制定計劃\n- 選擇工具\n\n**3. Act (行動)**\n- 執行工具\n- 呼叫 API\n- 操作檔案系統\n\n**4. Learn (學習)**\n- 儲存經驗\n- 優化策略\n- 記憶機制\n\n**Agent vs 傳統程式**\n- 傳統: 固定 if-else\n- Agent: 動態推理\n- 傳統: try-catch\n- Agent: 自主修正\n\n**應用案例**\n- 程式碼生成 + 自動測試\n- 文件問答 (RAG)\n- PPT 自動生成\n- 數據分析報告\n\n**學習時間**: 2-3 天",
                "resources": [
                    { "title": "LangChain Agents", "url": "https://python.langchain.com/docs/modules/agents/" }
                ]
            },
            "position": { "x": 400, "y": 600 }
        },
        {
            "id": "7",
            "type": "custom",
            "data": {
                "label": "Agent 循環",
                "subtitle": "Agent Loop",
                "category": "core",
                "description": "Agent 的核心執行循環",
                "content": "**Agent Loop 四階段**\n\n``````\n\n**ReAct Pattern (Reason + Act)**\n\n``````\n\n**實作重點**\n- 最大迭代次數: 5-10 次\n- 解析 LLM 輸出 (Action/Input)\n- 錯誤處理 (工具執行失敗)\n- 狀態管理 (對話歷史)\n\n**停止條件**\n- 出現 \"Final Answer\"\n- 達到最大迭代\n- 工具執行錯誤\n- 用戶中斷\n\n**學習時間**: 3-5 天",
                "resources": [
                    { "title": "ReAct 論文", "url": "https://arxiv.org/abs/2210.03629" }
                ]
            },
            "position": { "x": 400, "y": 750 }
        },
        {
            "id": "8",
            "type": "custom",
            "data": {
                "label": "應用案例",
                "subtitle": "Example Use Cases",
                "category": "core",
                "description": "AI Agents 實際應用場景",
                "content": "**1. 程式碼生成 Agent**\n``````\n\n**2. 文件問答 Agent (RAG)**\n``````\n\n**3. PPT 生成 Agent**\n``````\n\n**4. 數據分析 Agent**\n``````\n\n**5. 個人助理 Agent**\n``````\n\n**你的專屬 Agent 建議**\n- C# 程式碼助手\n- 內網文件問答\n- 自動化測試生成\n- 技術文件撰寫\n\n**學習時間**: 依需求 1-2 週",
                "resources": []
            },
            "position": { "x": 400, "y": 900 }
        },
        {
            "id": "9",
            "type": "custom",
            "data": {
                "label": "提示工程",
                "subtitle": "Prompt Engineering",
                "category": "skill",
                "description": "撰寫有效 Prompt 的技巧",
                "content": "**核心原則**\n\n**1. Be Specific (明確)**\n \"介紹 AI\"\n \"用 300 字介紹 AI Agents，包含定義、能力、案例，目標讀者: C# 工程師\"\n\n**2. Provide Context (上下文)**\n``````\n\n**3. Use Examples (Few-shot)**\n``````\n\n**4. Specify Format (指定格式)**\n``````\n\n**進階技巧**\n\n**Chain of Thought (CoT)**\n``````\n\n**專屬模板庫**\n\n**C# 程式碼生成**\n``````csharp ... ``````\n\n**PPT 生成**\n``````\n\n**學習時間**: 1-2 週持續優化",
                "resources": [
                    { "title": "Prompt Engineering Roadmap", "url": "https://roadmap.sh/prompt-engineering" },
                    { "title": "OpenAI Prompt Guide", "url": "https://platform.openai.com/docs/guides/prompt-engineering" }
                ]
            },
            "position": { "x": 200, "y": 1050 }
        },
        {
            "id": "10",
            "type": "custom",
            "data": {
                "label": "工具與動作",
                "subtitle": "Tools & Actions",
                "category": "skill",
                "description": "定義與使用 Agent 工具",
                "content": "**Tool Definition 結構**\n\n``````\n\n**常見工具類型**\n\n**1. Web Search (網頁搜尋)**\n- DuckDuckGo API\n- Google Custom Search\n- SerpAPI\n\n**2. Code Execution (程式碼執行)**\n- Python REPL\n- 沙箱執行\n- Timeout 控制\n\n**3. Database Queries (資料庫查詢)**\n- SQL 查詢\n- NoSQL 操作\n- 結果格式化\n\n**4. API Requests (API 呼叫)**\n- REST API\n- GraphQL\n- Ollama/OpenAI API\n\n**5. File System (檔案操作)**\n- 讀取檔案\n- 寫入檔案\n- 目錄操作\n\n**6. Email/Communication**\n- 發送 Email\n- Slack 通知\n- SMS 簡訊\n\n**Error Handling**\n``````\n\n**實作範例**\n``````\n\n**學習時間**: 1 週建立工具庫",
                "resources": [
                    { "title": "LangChain Tools", "url": "https://python.langchain.com/docs/modules/tools/" }
                ]
            },
            "position": { "x": 600, "y": 1050 }
        },
        {
            "id": "11",
            "type": "custom",
            "data": {
                "label": "Agent 記憶",
                "subtitle": "Agent Memory",
                "category": "advanced",
                "description": "記憶系統設計",
                "content": "**Memory 系統架構**\n\n``````\n\n**Short Term Memory**\n- Conversation Buffer: 最近對話\n- 最大 10-20 輪\n- 超過則移除最舊的\n\n**Long Term Memory**\n- Vector DB (Chroma/Qdrant): 語義搜尋\n- SQL DB: 結構化資料\n- User Profile: 用戶偏好\n\n**記憶類型**\n\n**Episodic Memory (情節記憶)**\n- 事件流水帳\n- 時間戳記\n- 完整對話記錄\n\n**Semantic Memory (語義記憶)**\n- 知識庫\n- 事實與概念\n- 技能與經驗\n\n**Summarization (摘要壓縮)**\n``````\n\n**Forgetting (遺忘機制)**\n- 時間衰減: 舊記憶降低重要性\n- 重要性評分: 保留關鍵資訊\n- 定期清理: 刪除無用記憶\n\n**實作範例**\n``````\n\n**學習時間**: 1 週",
                "resources": [
                    { "title": "LangChain Memory", "url": "https://python.langchain.com/docs/modules/memory/" }
                ]
            },
            "position": { "x": 200, "y": 1200 }
        },
        {
            "id": "12",
            "type": "custom",
            "data": {
                "label": "Agent 架構",
                "subtitle": "Agent Architectures",
                "category": "advanced",
                "description": "不同 Agent 架構模式",
                "content": "**1. ReAct (Reason + Act)**\n``````\n\n**2. Chain of Thought (CoT)**\n``````\n\n**3. Planner-Executor**\n``````\n\n**4. Tree-of-Thought**\n``````\n\n**5. RAG Agent**\n``````\n\n**6. Model Context Protocol (MCP)**\n``````\n\n**選擇建議**\n- 一般對話: ReAct\n- 複雜推理: CoT / Tree-of-Thought\n- 多步驟任務: Planner-Executor\n- 文件問答: RAG Agent\n- 多模型: MCP\n\n**學習時間**: 2 週實作不同架構",
                "resources": [
                    { "title": "ReAct 論文", "url": "https://arxiv.org/abs/2210.03629" },
                    { "title": "Tree of Thoughts", "url": "https://arxiv.org/abs/2305.10601" }
                ]
            },
            "position": { "x": 600, "y": 1200 }
        },
        {
            "id": "13",
            "type": "custom",
            "data": {
                "label": "從零建構",
                "subtitle": "Building from Scratch",
                "category": "advanced",
                "description": "手動建構 Agent 系統",
                "content": "**為什麼從零建構？**\n- 完全掌控流程\n- 無框架依賴\n- 理解底層原理\n- 客製化彈性\n\n**核心組件**\n\n**1. LLM API 呼叫**\n``````\n\n**2. Agent Loop 實作**\n``````\n\n**3. 工具執行**\n``````\n\n**4. 解析 LLM 輸出**\n``````\n\n**5. 狀態管理**\n``````\n\n**6. 錯誤處理**\n``````\n\n**完整 Agent 範例**\n見程式碼庫: DIYAgent 類別\n\n**學習時間**: 1-2 週",
                "resources": []
            },
            "position": { "x": 200, "y": 1350 }
        },
        {
            "id": "14",
            "type": "custom",
            "data": {
                "label": "LLM 原生函數呼叫",
                "subtitle": "LLM Native Function Calling",
                "category": "advanced",
                "description": "使用 LLM 內建工具功能",
                "content": "**OpenAI Function Calling**\n``````\n\n**Anthropic Tool Use (Claude)**\n``````\n\n**Gemini Function Calling**\n``````\n\n**OpenAI Assistant API**\n``````\n\n**優點**\n-  LLM 原生支援，更穩定\n-  無需自己解析輸出\n-  錯誤處理完善\n\n**缺點**\n-  綁定特定平台\n-  成本較高\n-  本地模型不支援\n\n**學習時間**: 1 週",
                "resources": [
                    { "title": "OpenAI Function Calling", "url": "https://platform.openai.com/docs/guides/function-calling" },
                    { "title": "Anthropic Tool Use", "url": "https://docs.anthropic.com/claude/docs/tool-use" }
                ]
            },
            "position": { "x": 400, "y": 1350 }
        },
        {
            "id": "15",
            "type": "custom",
            "data": {
                "label": "Agent 框架",
                "subtitle": "Agent Frameworks",
                "category": "advanced",
                "description": "使用成熟框架快速開發",
                "content": "**LangChain**\n``````\n\n**CrewAI (Multi-Agent)**\n``````\n\n**AutoGen (Microsoft)**\n``````\n\n**LlamaIndex (RAG 專精)**\n``````\n\n**框架比較**\n\n| 框架 | 學習曲線 | 多 Agent | 自訂性 | 適用場景 |\n|------|----------|----------|--------|----------|\n| LangChain | 中 | 有限 | ⭐⭐⭐⭐ | 單一 Agent |\n| CrewAI | 低 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 多角色協作 |\n| AutoGen | 高 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 複雜系統 |\n| LlamaIndex | 中 | 有限 | ⭐⭐⭐⭐ | RAG 專精 |\n\n**選擇建議**\n- 快速開發: LangChain / CrewAI\n- 學習原理: 從零建構\n- 多 Agent: CrewAI / AutoGen\n- RAG 系統: LlamaIndex\n\n**學習時間**: 2 週",
                "resources": [
                    { "title": "LangChain", "url": "https://python.langchain.com/" },
                    { "title": "CrewAI", "url": "https://www.crewai.com/" },
                    { "title": "AutoGen", "url": "https://microsoft.github.io/autogen/" }
                ]
            },
            "position": { "x": 600, "y": 1350 }
        },
        {
            "id": "16",
            "type": "custom",
            "data": {
                "label": "評估與測試",
                "subtitle": "Evaluation & Testing",
                "category": "production",
                "description": "Agent 測試與評估策略",
                "content": "**測試層級**\n\n**1. Unit Testing (單元測試)**\n``````\n\n**2. Integration Testing (整合測試)**\n``````\n\n**3. Human-in-the-Loop (人工評估)**\n- 測試集: 50-100 個真實問題\n- 評估標準: 準確性、相關性、完整性\n- A/B 測試: 比較不同版本\n\n**追蹤指標**\n\n**效能指標**\n- 平均延遲 (秒)\n- Token 使用量\n- 成本 ($/請求)\n- 成功率 (%)\n\n**品質指標**\n- 答案準確率\n- 來源相關性\n- 幻覺率\n- 用戶滿意度\n\n**實作範例**\n``````\n\n**評估框架**\n\n**LangSmith**\n- 自動追蹤每次執行\n- 視覺化追蹤鏈\n- 評估測試集\n\n**Ragas (RAG 專用)**\n- Faithfulness: 忠實度\n- Answer Relevancy: 回答相關性\n- Context Precision: 上下文精確度\n\n**DeepEval**\n- 全面評估工具\n- 支援多種指標\n- 批量測試\n\n**學習時間**: 1 週",
                "resources": [
                    { "title": "LangSmith", "url": "https://www.langchain.com/langsmith" },
                    { "title": "Ragas", "url": "https://github.com/explodinggradients/ragas" }
                ]
            },
            "position": { "x": 200, "y": 1500 }
        },
        {
            "id": "17",
            "type": "custom",
            "data": {
                "label": "除錯與監控",
                "subtitle": "Debugging & Monitoring",
                "category": "production",
                "description": "Observability 與問題排查",
                "content": "**Structured Logging**\n``````\n\n**Tracing (追蹤)**\n``````\n\n**監控工具**\n\n**LangSmith**\n- 完整追蹤鏈\n- 視覺化流程\n- 效能分析\n- 成本追蹤\n\n**Helicone**\n- LLM 請求監控\n- 延遲追蹤\n- Token 使用\n- 錯誤率\n\n**LangFuse (開源)**\n- 自架監控\n- 完整控制\n- 隱私保護\n\n**監控儀表板**\n``````\n\n**告警設定**\n``````\n\n**除錯技巧**\n\n**1. 追蹤每步執行**\n``````\n\n**2. 檢查 Prompt**\n``````\n\n**3. 驗證工具輸出**\n``````\n\n**4. 測試隔離組件**\n``````\n\n**學習時間**: 3-5 天",
                "resources": [
                    { "title": "LangSmith", "url": "https://smith.langchain.com" },
                    { "title": "Helicone", "url": "https://www.helicone.ai/" },
                    { "title": "LangFuse", "url": "https://langfuse.com/" }
                ]
            },
            "position": { "x": 600, "y": 1500 }
        },
        {
            "id": "18",
            "type": "custom",
            "data": {
                "label": "安全與倫理",
                "subtitle": "Security & Ethics",
                "category": "production",
                "description": "安全性與倫理考量",
                "content": "**Prompt Injection 防護**\n``````\n\n**Tool Sandboxing (工具沙箱)**\n``````\n\n**Permissioning (權限管理)**\n``````\n\n**Data Privacy + PII Redaction**\n``````\n\n**Bias & Toxicity Guardrails**\n``````\n\n**Safety Checklist**\n``````\n\n**倫理原則**\n- 透明性: 說明 AI 限制\n- 公平性: 避免偏見\n- 隱私: 保護用戶資料\n- 可解釋: 提供推理過程\n- 人類監督: 關鍵決策需人工\n\n**學習時間**: 1 週",
                "resources": []
            },
            "position": { "x": 400, "y": 1650 }
        },
        {
            "id": "19",
            "type": "custom",
            "data": {
                "label": "多 Agent 系統",
                "subtitle": "Multi-Agent Systems",
                "category": "advanced",
                "description": "多 Agent 協作",
                "content": "**為什麼需要多 Agent？**\n- 專業分工 (研究員 + 作家 + 審核)\n- 並行處理 (提升效率)\n- 模塊化 (易於維護)\n- 複雜任務分解\n\n**Agent Communication**\n``````\n\n**Hierarchical Agents (階層式)**\n``````\n\n**CrewAI Multi-Agent 範例**\n``````\n\n**Coordination Patterns**\n\n**1. Sequential (依序)**\n``````\n\n**2. Parallel (並行)**\n``````\n\n**3. Debate (辯論)**\n``````\n\n**4. Swarm (群體)**\n``````\n\n**實際應用**\n- 研究報告生成 (研究+寫作+審核)\n- 程式碼開發 (需求+設計+開發+測試)\n- 數據分析 (收集+分析+視覺化+報告)\n\n**學習時間**: 2 週",
                "resources": [
                    { "title": "AutoGen Multi-Agent", "url": "https://microsoft.github.io/autogen/" },
                    { "title": "CrewAI Docs", "url": "https://docs.crewai.com/" }
                ]
            },
            "position": { "x": 200, "y": 1800 }
        },
        {
            "id": "20",
            "type": "custom",
            "data": {
                "label": "進階 RAG",
                "subtitle": "Advanced RAG",
                "category": "advanced",
                "description": "進階 RAG 技術",
                "content": "**基礎 RAG 的限制**\n- 檢索精度不足\n- 長文件切割不當\n- 無法處理複雜查詢\n\n**Hybrid Search (混合搜尋)**\n``````\n\n**Re-ranking (重新排序)**\n``````\n\n**Query Rewriting (查詢改寫)**\n``````\n\n**Metadata Filtering (元數據過濾)**\n``````\n\n**Graph RAG (圖 RAG)**\n``````\n\n**Agentic RAG (Agent 驅動)**\n``````\n\n**HyDE (Hypothetical Document Embeddings)**\n``````\n\n**學習時間**: 2 週",
                "resources": [
                    { "title": "Advanced RAG Techniques", "url": "https://www.pinecone.io/learn/advanced-rag/" }
                ]
            },
            "position": { "x": 600, "y": 1800 }
        },
        {
            "id": "21",
            "type": "custom",
            "data": {
                "label": "生產部署",
                "subtitle": "Production Deployment",
                "category": "production",
                "description": "生產環境部署考量",
                "content": "**Scalability (可擴展性)**\n\n**水平擴展**\n``````\n\n**垂直擴展**\n- 增加 CPU/RAM\n- 使用 GPU 加速\n- 優化模型量化\n\n**Cost Optimization (成本優化)**\n\n**1. Caching (快取)**\n``````\n\n**2. Model Selection**\n- 簡單任務: GPT-3.5 ($0.002/1K)\n- 複雜任務: GPT-4 ($0.03/1K)\n- 批量任務: 本地 Ollama (免費)\n\n**3. Prompt Compression**\n``````\n\n**Latency Management (延遲管理)**\n\n**1. Streaming (串流)**\n``````\n\n**2. Parallel Execution**\n``````\n\n**3. Timeout Control**\n``````\n\n**Load Balancing (負載平衡)**\n``````\n\n**Fallback Mechanisms (降級機制)**\n``````\n\n**A/B Testing (A/B 測試)**\n``````\n\n**Deployment Checklist**\n``````\n\n**部署平台**\n- Railway: 簡單快速\n- Render: 免費層\n- AWS/GCP: 企業級\n- 內網: Docker + Kubernetes\n\n**學習時間**: 2 週",
                "resources": []
            },
            "position": { "x": 400, "y": 1950 }
        }
    ],
    "edges": [
        { "id": "e1-2", "source": "1", "target": "2", "animated": true, "type": "smoothstep" },
        { "id": "e2-3", "source": "2", "target": "3", "animated": true, "type": "smoothstep" },
        { "id": "e2-4", "source": "2", "target": "4", "animated": true, "type": "smoothstep" },
        { "id": "e2-5", "source": "2", "target": "5", "animated": true, "type": "smoothstep" },
        { "id": "e3-6", "source": "3", "target": "6", "animated": true, "type": "smoothstep" },
        { "id": "e4-6", "source": "4", "target": "6", "animated": true, "type": "smoothstep" },
        { "id": "e5-6", "source": "5", "target": "6", "animated": true, "type": "smoothstep" },
        { "id": "e6-7", "source": "6", "target": "7", "animated": true, "type": "smoothstep" },
        { "id": "e7-8", "source": "7", "target": "8", "animated": true, "type": "smoothstep" },
        { "id": "e8-9", "source": "8", "target": "9", "animated": true, "type": "smoothstep" },
        { "id": "e8-10", "source": "8", "target": "10", "animated": true, "type": "smoothstep" },
        { "id": "e9-11", "source": "9", "target": "11", "animated": true, "type": "smoothstep" },
        { "id": "e10-12", "source": "10", "target": "12", "animated": true, "type": "smoothstep" },
        { "id": "e11-13", "source": "11", "target": "13", "animated": true, "type": "smoothstep" },
        { "id": "e12-13", "source": "12", "target": "13", "animated": true, "type": "smoothstep" },
        { "id": "e12-14", "source": "12", "target": "14", "animated": true, "type": "smoothstep" },
        { "id": "e12-15", "source": "12", "target": "15", "animated": true, "type": "smoothstep" },
        { "id": "e13-16", "source": "13", "target": "16", "animated": true, "type": "smoothstep" },
        { "id": "e14-16", "source": "14", "target": "16", "animated": true, "type": "smoothstep" },
        { "id": "e15-17", "source": "15", "target": "17", "animated": true, "type": "smoothstep" },
        { "id": "e16-18", "source": "16", "target": "18", "animated": true, "type": "smoothstep" },
        { "id": "e17-18", "source": "17", "target": "18", "animated": true, "type": "smoothstep" },
        { "id": "e15-19", "source": "15", "target": "19", "animated": true, "type": "smoothstep" },
        { "id": "e15-20", "source": "15", "target": "20", "animated": true, "type": "smoothstep" },
        { "id": "e18-21", "source": "18", "target": "21", "animated": true, "type": "smoothstep" },
        { "id": "e19-21", "source": "19", "target": "21", "animated": true, "type": "smoothstep" },
        { "id": "e20-21", "source": "20", "target": "21", "animated": true, "type": "smoothstep" }
    ],
    "categoryColors": {
        "foundation": {
            "bg": "rgba(251, 191, 36, 0.1)",
            "border": "#fbbf24",
            "text": "#fbbf24"
        },
        "core": {
            "bg": "rgba(59, 130, 246, 0.1)",
            "border": "#3b82f6",
            "text": "#3b82f6"
        },
        "skill": {
            "bg": "rgba(16, 185, 129, 0.1)",
            "border": "#10b981",
            "text": "#10b981"
        },
        "advanced": {
            "bg": "rgba(168, 85, 247, 0.1)",
            "border": "#a855f7",
            "text": "#a855f7"
        },
        "production": {
            "bg": "rgba(236, 72, 153, 0.1)",
            "border": "#ec4899",
            "text": "#ec4899"
        }
    }
}
