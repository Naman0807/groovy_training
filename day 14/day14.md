# Day 14 — Multi-Step Agents · LangChain · LlamaIndex · Custom

**Trainee:** Naman  
**Date:** Thursday, June 25, 2026  
**Theme:** Multi-Step Agents — Build the same agent 3 ways and compare  
**Deliverable:** 3 agent implementations + comparison report + weekly meetup demo

---

## Table of Contents

1. [Task List](#1-task-list)
2. [Build Log](#2-build-log)
3. [Framework Comparison Summary](#3-framework-comparison-summary)
4. [Agent Memory Implementation](#4-agent-memory-implementation)
5. [Weekly Meetup Demo Notes](#5-weekly-meetup-demo-notes)
6. [Daily Reflection](#6-daily-reflection)

---

## 1. Task List

| # | Task | Status | Notes |
| :- | :--- | :----- | :---- |
| 1 | Build LangChain agent loop (Python) | Done | AgentExecutor + create_tool_calling_agent |
| 2 | Build LlamaIndex query engine agent | Done | ReActAgent.from_tools() |
| 3 | Build pure SDK agent loop | Done | Manual call→parse→execute→repeat |
| 4 | Compare 3 versions | Done | See comparison.md |
| 5 | Implement agent memory (short-term + long-term) | Done | See Section 4 |
| 6 | Attend weekly meetup · demo agent | Done | See Section 5 |

---

## 2. Build Log

### 09:00 — 09:30 · Setup & Planning

Created directory structure:
```
multi-agent/
├── langchain_agent/
├── llamaindex_agent/
├── pure_agent/
├── comparison.md
└── README.md
```

All agents share the same capability: web search (DuckDuckGo) + calculator + conversational memory.

### 09:30 — 10:15 · Pure SDK Agent (Baseline)

Built first because it forces understanding of the underlying loop:

```python
# The core loop — same pattern all frameworks implement
while True:
    response = model.generate_content(..., tools=TOOLS)
    part = response.candidates[0].content.parts[0]
    if part.text:
        return part.text
    if part.function_call:
        result = execute_tool(part.function_call.name, dict(part.function_call.args))
        # append function_call + function_response to messages, repeat
```

**Key insight:** The agent loop is ~15 lines of logic. Everything else is scaffolding.

### 10:15 — 11:00 · LangChain Agent

Used `create_tool_calling_agent` + `AgentExecutor` + `ConversationBufferMemory`.

**Observations:**
- 7 imports for a simple agent — felt heavy
- AgentExecutor wraps the loop (convenient but opaque)
- `@tool` decorator is clean for defining tools
- `ConversationBufferMemory(return_messages=True)` handled history automatically
- Verbose mode is noisy — hard to see what's happening

### 11:00 — 11:30 · LlamaIndex Agent

Used `ReActAgent.from_tools()` + `ChatMemoryBuffer`.

**Observations:**
- Cleanest API — one-liner to create the agent
- `FunctionTool.from_defaults(fn=web_search)` is intuitive
- ReAct verbose output is clearer than LangChain
- Memory setup is minimal but less configurable

### 11:30 — 12:30 · Comparison & Writeup

Created `comparison.md` with side-by-side analysis. See Section 3 for summary.

### 12:30 — 13:30 · Agent Memory Implementation

Added short-term (conversation buffer) + long-term (summary-based) memory to the pure SDK agent. See Section 4.

### 13:30 — 14:30 · Lunch

### 14:30 — 15:30 · Prepare Meetup Demo

Setup demo script, tested all three agents with the same 5 queries, prepared comparison slides.

### 15:30 — 16:30 · Weekly Meetup & Demo

Attended Groovy Web weekly meetup, demoed all three agents. See Section 5.

### Issues Encountered

| Problem | Resolution |
| :------ | :--------- |
| LangChain: `DuckDuckGoSearchRun()` requires `duckduckgo_search` installed | Added to requirements.txt |
| LlamaIndex: ReAct agent would sometimes loop on tool calls | Added `max_iterations=10` to ReActAgent |
| Pure SDK: Tool schema format differs from Gemini's expected JSON | Fixed — Gemini uses `parameters` not `input_schema` |
| LangChain: Memory losses on first turn | Added `return_messages=True` to ConversationBufferMemory |
| Pure SDK: Multi-turn history growing unbounded | Added token-based truncation (last 20 messages) |

---

## 3. Framework Comparison Summary

| Metric | LangChain | LlamaIndex | Pure SDK |
| :----- | :-------- | :--------- | :------- |
| Lines of code | ~50 | ~40 | ~65 |
| Cold start latency | ~2.1s | ~1.8s | ~1.5s |
| Per-turn latency | ~1.5–2.0s | ~1.3–1.8s | ~1.1–1.5s |
| Imports needed | 7 | 4 | 2 |
| Dependencies | 4 packages | 3 packages | 2 packages |
| Loop visibility | Hidden (AgentExecutor) | Hidden (ReActAgent) | Explicit |
| Memory config | High | Medium | Full control |
| Debugging | Noisy | Clear | Trivial |
| Customization | Hard (abstractions) | Moderate | Full |

**Verdict from comparison.md:**

> **Naman's take:** Building the pure SDK version first was the most educational. Once you understand the underlying loop (call → parse tool → execute → append → repeat), the frameworks just become automation around that same pattern. I'd start pure SDK for learning, then reach for LlamaIndex for real projects.

---

## 4. Agent Memory Implementation

### Short-Term Memory (Conversation Buffer)

All three agents implement short-term memory by appending every exchange to a message list:

| Framework | Implementation | Mechanism |
| :-------- | :------------- | :-------- |
| LangChain | `ConversationBufferMemory(return_messages=True)` | Automatic — stores messages, injects into prompt via `MessagesPlaceholder` |
| LlamaIndex | `ChatMemoryBuffer.from_defaults(token_limit=16000)` | Automatic — built into ReActAgent; token-aware truncation |
| Pure SDK | `messages.append({"role": "user"/"assistant", "content": ...})` | Manual list append; full control |

### Long-Term Memory (Summary)

Implemented on the pure SDK agent for long-running sessions:

```python
def summarize_history(messages: list, client: genai.GenerativeModel) -> str:
    """Compress old messages into a summary when token limit is near."""
    conversation_text = "\n".join(
        f"{m['role']}: {m.get('parts', [{}])[0].get('text', '') if isinstance(m.get('parts'), list) else m.get('content', '')}"
        for m in messages[:-6]
    )
    response = client.generate_content(
        f"Summarize this conversation concisely, keeping key facts and user preferences:\n{conversation_text}",
    )
    return response.text
```

**Strategy used:**
1. Keep last N messages in full fidelity (short-term buffer)
2. When token count exceeds threshold → summarize older messages into a system prompt line
3. Replace summarized portion with: `"Previous conversation summary: <summary>"`
4. This gives the agent both recent context (detailed) + long-term context (compressed)

**Trade-offs identified:**
- Summarization costs an extra API call per threshold crossing
- Important details can be lost in compression
- Threshold needs tuning per model context window
- Hybrid approach (semantic + recency) would be ideal but overkill for Day 14

### Token Management

```python
MAX_TOKENS = 50000  # conservative for Gemini 1M context

def estimate_tokens(messages: list) -> int:
    return sum(len(str(m)) for m in messages) // 4  # rough estimate
```

### Key Takeaway

> Memory is the hardest part of agent design. Short-term is trivial (append to list). Long-term is hard — summarization trades detail for context length. The best approach depends on the use case: for a chat agent, recency matters most; for a research agent, full retention with retrieval is better.

---

## 5. Weekly Meetup Demo Notes

**Event:** Groovy Web Weekly Meetup (Week 3)  
**Date:** Thursday, June 25, 2026, 15:30 — 16:30  
**Attendees:** Krunal (Mentor), Rahul, Nauman, Parth, Dhruti, +12 other cohort members  
**Topic:** Multi-Step Agents — 3 Frameworks Compared

### Demo Script

Ran all three agents with the same 5 questions:

| # | Question | Tests |
| :- | :------- | :---- |
| 1 | "What is the current population of Japan?" | Web search |
| 2 | "What is 1520 * 3.7?" | Calculator |
| 3 | "What was Japan's GDP in 2023?" | Web search + follow-up memory |
| 4 | "Calculate 42700 / 12 and round to 2 decimals" | Calculator |
| 5 | "Sum up Japan's population and GDP per capita" | Multi-tool (search + calc) |

### Demo Flow

1. **(3 min)** Explained the core agent loop (slides: diagram of call→parse→execute→repeat)
2. **(3 min)** Ran Pure SDK agent — showed each step printed to console
3. **(2 min)** Ran LangChain agent — noted the abstraction overhead
4. **(2 min)** Ran LlamaIndex agent — showed cleanest setup
5. **(3 min)** Ran memory test: "What was Japan's population?" → "Now what was its GDP?" → demonstrated recall
6. **(2 min)** Showed long-term memory summarization in action
7. **(5 min)** Q&A

### Audience Questions & Feedback

**Q (Rahul):** "Which one would you use for production?"
**A:** "LlamaIndex for most things — it's the Goldilocks option. Pure SDK if I need maximum performance or have unusual tool shapes. LangChain only if I need its specific integrations."

**Q (Nauman):** "Did you measure token overhead from the frameworks?"
**A:** "Yes — LangChain adds ~200-400 tokens per turn from system prompts and memory serialization. Pure SDK has zero overhead. LlamaIndex is in the middle (~100-200 token overhead for the ReAct prompt wrapper)."

**Q (Parth):** "How do you handle tool errors in the pure SDK version?"
**A:** "The try/except in execute_tool returns an error string. That string goes back to the LLM as a function_response, and Gemini usually apologizes and retries or explains the issue. No special error recovery needed — the model handles it."

**Q (Dhruti):** "Does the long-term memory summarization actually work well?"
**A:** "It works for maintaining facts (user's name, preferences) but loses nuance. Good enough for a demo but I'd want a proper retrieval system for production."

**Feedback from Krunal (Mentor):**
> "This is exactly the right approach — build it raw first, then compare frameworks. You now understand what each framework is doing under the hood. Most engineers skip the 'pure' version and end up confused when the framework does something unexpected. Well done. For next week, consider adding a streaming variant and a multi-agent (supervisor + worker) pattern."

### What Went Well

- All three agents worked on the first demo run (no mid-demo debugging)
- The pure SDK version generated the most interest — team appreciated seeing the raw loop
- Memory test showed clear differentiation between frameworks
- Comparison spreadsheet was well-received — team asked for a copy

### What Could Improve

- LangChain agent took noticeably longer to respond (visible latency difference)
- No streaming support in any agent yet — Krunal suggested adding streaming next
- Long-term memory summarization quality is inconsistent on complex topics
- Calculator tool doesn't handle advanced math (sin, cos, log) — should extend

---

## 6. Daily Reflection

> [!TIP]
> **Biggest takeaway:** The agent loop is simple (~15 lines). The frameworks add abstractions for convenience, but they also add complexity, latency, and opacity. Building the pure SDK version first was the most valuable part of the day — now when LangChain or LlamaIndex does something unexpected, I know exactly what loop they're running under the hood.

### Stats

| Metric | Value |
| :----- | :---- |
| Agent implementations | 3 (LangChain, LlamaIndex, Pure SDK) |
| Lines of agent code | ~155 total (~50/40/65) |
| Dependencies across all 3 | 9 packages |
| API calls made | ~45 (testing × 3 frameworks) |
| Total API cost for the day | ~$0.40 |
| Frameworks compared | 3 |
| Hours spent | ~6 |
| Memory strategies implemented | 2 (short-term buffer, long-term summarization) |
| Key takeaway | Understand the loop first, then choose the framework |

---

### Files Created

```
days/day14/
├── day14.md                                       — This log
└── multi-agent/
    ├── README.md                                  — Overview & setup instructions
    ├── comparison.md                              — Framework comparison (pros/cons, speed, LoC)
    ├── langchain_agent/
    │   ├── agent.py                               — LangChain tool-calling agent
    │   └── requirements.txt
    ├── llamaindex_agent/
    │   ├── agent.py                               — LlamaIndex ReAct agent
    │   └── requirements.txt
    └── pure_agent/
        ├── agent.py                               — Pure Gemini SDK agent loop
        └── requirements.txt
```
