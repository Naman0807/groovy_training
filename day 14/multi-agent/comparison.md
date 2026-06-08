# Framework Comparison: LangChain vs LlamaIndex vs Pure SDK

All three agents implement the same task: answer user questions using web search + calculator tools with conversational memory.

## Lines of Code (agent logic only)

| Framework | Lines | Boilerplate | Learning Curve |
| :------- | ----: | :---------- | :------------- |
| LangChain | ~50   | Medium      | Steep — many abstractions (AgentExecutor, PromptTemplate, memory wrappers) |
| LlamaIndex | ~40  | Low         | Moderate — ReActAgent handles the loop, FunctionTool wraps functions |
| Pure SDK  | ~65   | None        | Lowest — just the loop, no magic |

## Speed (per-turn latency, local test)

| Framework | Cold Start | Per-Turn | Notes |
| :-------- | :--------- | :------- | :---- |
| LangChain | ~2.1s      | ~1.5–2.0s | Heavy abstraction stack; memory serialization adds overhead |
| LlamaIndex | ~1.8s     | ~1.3–1.8s | Lighter than LangChain; ReAct loop is efficient |
| Pure SDK  | ~1.5s      | ~1.1–1.5s | Fastest — no middleware, no serialization, direct API calls |

## Readability & Maintainability

| Criteria | LangChain | LlamaIndex | Pure SDK |
| :------- | :-------- | :--------- | :------- |
| **Explicit loop** | Hidden in AgentExecutor | Hidden in ReActAgent | Written line-by-line |
| **Tool definition** | `@tool` decorator + class | `FunctionTool.from_defaults(fn=)` | Raw JSON schema |
| **Memory** | ConversationBufferMemory | ChatMemoryBuffer | Manual list append |
| **Debugging** | AgentExecutor(verbose=True) cascades; hard to trace | ReActAgent verbose output is clearer | Print each step — trivial to debug |
| **Error handling** | Built-in retry + parsing | Built-in retry | Manual — full control |

## Pros & Cons

### LangChain

**Pros:**
- Huge ecosystem (50+ integrations, vectorstores, retrievers, document loaders)
- Battle-tested in production
- ConversationBufferMemory handles message history automatically
- Tool calling agent is mature and handles edge cases (malformed tool JSON, multiple tool calls)

**Cons:**
- Over-engineered for simple agents — 7 imports for ~50 lines of agent code
- Abstractions leak; need to understand AgentExecutor, Agent, PromptTemplate, memory wrappers
- Verbose output even at minimal logging
- Dependency chain is heavy (langchain-core, langchain-community, provider packages)

### LlamaIndex

**Pros:**
- Cleaner API than LangChain — `ReActAgent.from_tools()` is one call
- FunctionTool wrapper is intuitive
- Designed for RAG/query engines (natural fit for data-aware agents)
- Lighter dependency footprint

**Cons:**
- Smaller ecosystem for agent-specific tools
- ReActAgent is opinionated — harder to customize the inner loop
- ChatMemoryBuffer works but less flexible than LangChain's memory options
- Documentation is thinner for agent workflows vs RAG pipelines

### Pure SDK (Gemini)

**Pros:**
- Zero framework overhead — fastest execution
- Full visibility into every API call, every tool execution
- Easy to debug, customize, and extend
- No surprises — what you see is what happens
- Minimal dependencies (google-generativeai + duckduckgo_search only)

**Cons:**
- Manual everything: tool parsing, message history, error handling
- No built-in retry logic or rate limiting
- No vector store or retriever integration out of the box
- Must implement complex patterns (streaming, parallel tool calls) from scratch

## Verdict

| Use Case | Recommendation |
| :------- | :------------- |
| **Quick prototype / learning** | Pure SDK — understand the loop first |
| **Production agent with RAG** | LlamaIndex — best balance of simplicity + data tools |
| **Complex multi-agent / tool ecosystem** | LangChain — widest integration support |
| **Production agent, simple tools** | Pure SDK — less bloat, full control |
