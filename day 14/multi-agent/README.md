# Day 14 — Multi-Step Agents

Three implementations of the same agent (web search + calculator + memory) using different frameworks.

## Structure

```
multi-agent/
├── langchain_agent/
│   ├── agent.py          # LangChain tool-calling agent
│   └── requirements.txt
├── llamaindex_agent/
│   ├── agent.py          # LlamaIndex ReAct agent
│   └── requirements.txt
├── pure_agent/
│   ├── agent.py          # Pure Gemini SDK agent loop
│   └── requirements.txt
├── comparison.md         # Framework comparison
└── README.md             # This file
```

## Prerequisites

- Python 3.10+
- `GEMINI_API_KEY` environment variable set
- Internet access (for DuckDuckGo search)

## Setup & Run

### 1. Pure SDK Agent (recommended to start)

```bash
cd pure_agent
pip install -r requirements.txt
python agent.py
```

### 2. LangChain Agent

```bash
cd langchain_agent
pip install -r requirements.txt
python agent.py
```

### 3. LlamaIndex Agent

```bash
cd llamaindex_agent
pip install -r requirements.txt
python agent.py
```

## What Each Agent Does

All three answer questions using:
- **Web search** — fetches current information via DuckDuckGo
- **Calculator** — evaluates mathematical expressions
- **Memory** — maintains conversation history across turns

Try these queries:
```
What is the current population of Japan?
What is 1520 * 3.7?
What was the GDP of Japan in 2023?
```

## Key Learning

The pure SDK version reveals the core agent loop:

1. Send user message + tools schema to LLM
2. LLM responds with text or a functionCall block
3. If text → return it (done)
4. If functionCall → execute the tool, append functionResponse, go to step 1

Frameworks like LangChain and LlamaIndex automate steps 2–4 but follow this exact pattern under the hood.
