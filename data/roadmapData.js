// Roadmap data structure for AI Agents learning path
export const initialNodes = [
  // Foundation
  {
    id: '1',
    type: 'custom',
    data: {
      label: 'Pre-requisites',
      category: 'foundation',
      description: 'Essential skills before starting with AI Agents',
      content: `Before diving into AI Agents, you should be familiar with:
- Git & Version Control
- Terminal/Command Line basics
- REST APIs and HTTP
- Basic programming concepts`,
      resources: [
        { title: 'Git Documentation', url: 'https://git-scm.com/doc' },
        { title: 'REST API Tutorial', url: 'https://restfulapi.net/' }
      ]
    },
    position: { x: 400, y: 0 }
  },
  
  // LLM Fundamentals
  {
    id: '2',
    type: 'custom',
    data: {
      label: 'LLM Fundamentals',
      category: 'core',
      description: 'Understanding Large Language Models',
      content: `Learn the basics of Large Language Models:
- Transformer Architecture
- Tokenization & Embeddings
- Context Windows
- Temperature & Top-p sampling
- Model fine-tuning basics`,
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
      label: 'What are AI Agents?',
      category: 'core',
      description: 'Introduction to AI Agents',
      content: `AI Agents are autonomous systems that can:
- Perceive their environment
- Make decisions
- Take actions to achieve goals
- Learn from feedback

They combine LLMs with tools and memory to perform complex tasks.`,
      resources: [
        { title: 'LangChain Agents', url: 'https://python.langchain.com/docs/modules/agents/' }
      ]
    },
    position: { x: 400, y: 240 }
  },

  // Agent Loop
  {
    id: '4',
    type: 'custom',
    data: {
      label: 'Agent Loop',
      category: 'core',
      description: 'The core reasoning loop of AI Agents',
      content: `The Agent Loop consists of:
1. **Perception**: Receive user input
2. **Reason & Plan**: Analyze and create action plan
3. **Acting**: Execute tools/actions
4. **Observation**: Gather results
5. **Reflection**: Learn and adjust`,
      resources: [
        { title: 'ReAct Pattern', url: 'https://arxiv.org/abs/2210.03629' }
      ]
    },
    position: { x: 400, y: 360 }
  },

  // Prompt Engineering
  {
    id: '5',
    type: 'custom',
    data: {
      label: 'Prompt Engineering',
      category: 'skill',
      description: 'Crafting effective prompts',
      content: `Master prompt engineering techniques:
- Clear instructions
- Few-shot learning
- Chain-of-thought prompting
- System prompts
- Prompt templates`,
      resources: [
        { title: 'OpenAI Prompt Guide', url: 'https://platform.openai.com/docs/guides/prompt-engineering' }
      ]
    },
    position: { x: 200, y: 480 }
  },

  // Tools & Actions
  {
    id: '6',
    type: 'custom',
    data: {
      label: 'Tools & Actions',
      category: 'skill',
      description: 'Extending agent capabilities',
      content: `Agents can use various tools:
- Database queries
- API calls
- Web scraping
- Code execution
- File operations
- Calculator functions`,
      resources: [
        { title: 'LangChain Tools', url: 'https://python.langchain.com/docs/modules/tools/' }
      ]
    },
    position: { x: 600, y: 480 }
  },

  // Memory Systems
  {
    id: '7',
    type: 'custom',
    data: {
      label: 'Memory Systems',
      category: 'advanced',
      description: 'Agent memory and context management',
      content: `Types of agent memory:
- Short-term (conversation buffer)
- Long-term (vector databases)
- Episodic memory
- Semantic memory
- Working memory`,
      resources: [
        { title: 'Memory in LangChain', url: 'https://python.langchain.com/docs/modules/memory/' }
      ]
    },
    position: { x: 200, y: 600 }
  },

  // Frameworks
  {
    id: '8',
    type: 'custom',
    data: {
      label: 'Agent Frameworks',
      category: 'advanced',
      description: 'Popular frameworks for building agents',
      content: `Popular frameworks:
- **LangChain**: Comprehensive agent framework
- **AutoGPT**: Autonomous GPT-4 agent
- **BabyAGI**: Task-driven autonomous agent
- **CrewAI**: Multi-agent orchestration
- **Semantic Kernel**: Microsoft's framework`,
      resources: [
        { title: 'LangChain', url: 'https://langchain.com' },
        { title: 'CrewAI', url: 'https://www.crewai.com/' }
      ]
    },
    position: { x: 600, y: 600 }
  },

  // Use Cases
  {
    id: '9',
    type: 'custom',
    data: {
      label: 'Use Cases',
      category: 'application',
      description: 'Real-world applications',
      content: `Common AI Agent applications:
- Personal assistants
- Code generation & debugging
- Data analysis & reporting
- Customer support automation
- Research & information gathering
- Content creation
- Task automation`,
      resources: []
    },
    position: { x: 400, y: 720 }
  },

  // Best Practices
  {
    id: '10',
    type: 'custom',
    data: {
      label: 'Best Practices',
      category: 'application',
      description: 'Production-ready agent development',
      content: `Key best practices:
- Error handling & retries
- Rate limiting
- Cost monitoring
- Security & sandboxing
- Testing & evaluation
- Logging & observability
- Human-in-the-loop`,
      resources: [
        { title: 'LangSmith', url: 'https://www.langchain.com/langsmith' }
      ]
    },
    position: { x: 400, y: 840 }
  }
];

export const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, type: 'smoothstep' },
  { id: 'e2-3', source: '2', target: '3', animated: true, type: 'smoothstep' },
  { id: 'e3-4', source: '3', target: '4', animated: true, type: 'smoothstep' },
  { id: 'e4-5', source: '4', target: '5', animated: true, type: 'smoothstep' },
  { id: 'e4-6', source: '4', target: '6', animated: true, type: 'smoothstep' },
  { id: 'e5-7', source: '5', target: '7', animated: true, type: 'smoothstep' },
  { id: 'e6-8', source: '6', target: '8', animated: true, type: 'smoothstep' },
  { id: 'e7-9', source: '7', target: '9', animated: true, type: 'smoothstep' },
  { id: 'e8-9', source: '8', target: '9', animated: true, type: 'smoothstep' },
  { id: 'e9-10', source: '9', target: '10', animated: true, type: 'smoothstep' }
];

// Category colors
export const categoryColors = {
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
  application: {
    bg: 'rgba(236, 72, 153, 0.1)',
    border: '#ec4899',
    text: '#ec4899'
  }
};
