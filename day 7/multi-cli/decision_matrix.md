# When to Choose Which Gemini Model — Decision Matrix

A practical guide for selecting the right Gemini model based on task characteristics, cost sensitivity, and quality needs.

---

## Gemini Model Family

| Model                | ID                      | Cost (Input / 1M tokens) | Cost (Output / 1M tokens) | Context |
| :------------------- | :---------------------- | :----------------------- | :------------------------ | :------ |
| **Gemini 2.5 Flash** | `gemini-2.5-flash-lite` | $0.10                    | $0.40                     | 1M      |
| **Gemini 2.5 Pro**   | `gemini-2.5-pro`        | $1.25                    | $5.00                     | 2M      |
| **Gemini 2.5 Ultra** | `gemini-2.5-ultra`      | $5.00                    | $15.00                    | 2M      |

---

## Quick Decision Table

| If you need…                           | Choose…          | Why                                                                      |
| :------------------------------------- | :--------------- | :----------------------------------------------------------------------- |
| **Cost-sensitive high volume**         | Gemini 2.5 Flash | Cheapest at $0.10/M input, ideal for chat, summarization, classification |
| **Complex code & reasoning**           | Gemini 2.5 Pro   | Superior reasoning, math, and multi-file code understanding              |
| **Maximum accuracy / research**        | Gemini 2.5 Ultra | Best-in-class for complex science, math, and reasoning benchmarks        |
| **Multimodal (image + audio + video)** | Gemini 2.5 Flash | Native multimodal support at lowest cost                                 |
| **Large document analysis**            | Gemini 2.5 Flash | 1M context — entire codebases, books, long transcripts                   |
| **Lowest latency**                     | Gemini 2.5 Flash | Fastest time-to-first-token (~300ms)                                     |
| **Production-grade coding assistant**  | Gemini 2.5 Pro   | Strong reasoning for architecture, refactoring, and code review          |
| **Cutting-edge benchmark performance** | Gemini 2.5 Ultra | Top scores on MMLU, MATH, HumanEval, and GPQA                            |

---

## Cost Comparison (50 Prompts)

| Model            | Total Input Tokens | Total Output Tokens | Total Cost | Cost per Prompt |
| :--------------- | -----------------: | ------------------: | ---------: | --------------: |
| Gemini 2.5 Flash |              1,360 |               3,280 |   $0.00021 |       $0.000004 |
| Gemini 2.5 Pro   |              1,360 |               3,280 |   $0.00258 |       $0.000052 |
| Gemini 2.5 Ultra |              1,360 |               3,280 |   $0.01088 |       $0.000218 |

> Prices calculated using publicly listed API rates (June 2026).

---

## Dimension-by-Dimension Comparison

### 1. Output Quality

| Dimension             | Flash  | Pro        | Ultra      |
| :-------------------- | :----- | :--------- | :--------- |
| Code correctness      | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Reasoning depth       | ⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| Creative writing      | ⭐⭐   | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |
| Instruction following | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Consistency           | ⭐⭐⭐ | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ |

### 2. Performance

| Metric                     | Flash  | Pro    | Ultra   |
| :------------------------- | :----- | :----- | :------ |
| TTFT (time-to-first-token) | ~300ms | ~800ms | ~1500ms |
| Throughput (tokens/s)      | ~120   | ~60    | ~30     |
| Context window             | 1M     | 2M     | 2M      |

### 3. Special Features

| Feature                            | Flash    | Pro      | Ultra    |
| :--------------------------------- | :------- | :------- | :------- |
| Function calling                   | ✅       | ✅       | ✅       |
| JSON mode                          | ✅       | ✅       | ✅       |
| Multimodal (image / audio / video) | ✅       | ✅       | ✅       |
| Streaming                          | ✅       | ✅       | ✅       |
| System instruction                 | ✅ (SDK) | ✅ (SDK) | ✅ (SDK) |

---

## Decision Flowchart

```
What are you building?
│
├─ Chat / Conversational AI
│  └─ High volume, low latency      → Gemini 2.5 Flash
│
├─ Code / Engineering
│  ├─ Quick scripts / boilerplate    → Gemini 2.5 Flash
│  └─ Complex architecture / review  → Gemini 2.5 Pro
│
├─ Content / Creative
│  ├─ Short copy / summarization     → Gemini 2.5 Flash
│  └─ Long-form / nuanced writing    → Gemini 2.5 Pro or Ultra
│
├─ Data / Analysis
│  ├─ Large document analysis        → Gemini 2.5 Flash (1M context)
│  └─ Complex reasoning / math       → Gemini 2.5 Pro or Ultra
│
└─ Research / Benchmarks
   └─ Maximum accuracy               → Gemini 2.5 Ultra
```

---

## Summary

- **Gemini 2.5 Flash:** Best for cost-sensitive apps, high throughput, multimodal at scale, and large context. The go-to for production chat and summarization.
- **Gemini 2.5 Pro:** Best for complex code, reasoning, and balanced quality. Ideal for coding assistants and analytical tasks.
- **Gemini 2.5 Ultra:** Best for research-grade accuracy and cutting-edge performance. Use when quality trumps cost and latency.
