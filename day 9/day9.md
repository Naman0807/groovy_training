# Day 9 — Gemini API Migration · Cost Optimization

**Trainee:** Naman  
**Date:** Thursday, June 18, 2026  
**Theme:** Google Gemini SDK integration, token telemetry, and cost-aware AI engineering  
**Deliverable:** Codebase explainer tool (Gemini) + token tracking dashboard + CSV telemetry

---

## Table of Contents

1. [Gemini API Migration — Implementation](#1-gemini-api-migration--implementation)
2. [Cost Comparison: Anthropic vs. Gemini](#2-cost-comparison-anthropic-vs-gemini)
3. [Token Tracking Dashboard](#3-token-tracking-dashboard)
4. [CSV Telemetry Format](#4-csv-telemetry-format)
5. [Codebase Explainer Tool](#5-codebase-explainer-tool)
6. [Weekly Meetup — Week 2 Learnings](#6-weekly-meetup--week-2-learnings)
7. [Daily Reflection](#7-daily-reflection)

---

## 1. Gemini API Migration — Implementation

### Why Gemini?

Google's `gemini-2.5-flash-lite` offers a dramatic cost advantage over Anthropic's Claude Sonnet:

| Provider    | Model                    | Input / M tokens | Output / M tokens |
| :---------- | :----------------------- | :--------------: | :---------------: |
| Anthropic   | claude-sonnet-4-20250514 |    **$3.00**     |    **$15.00**     |
| Google      | gemini-2.5-flash-lite    |    **$0.10**     |     **$0.40**     |
| **Savings** |                          | **30× cheaper**  | **37.5× cheaper** |

### SDK Migration — Python

**Before (Anthropic):**

```python
import anthropic
client = anthropic.Anthropic()
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    system=[{"type": "text", "text": system_prompt, "cache_control": ...}],
    messages=[{"role": "user", "content": prompt}],
)
```

**After (Gemini):**

```python
import google.generativeai as genai
genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-lite",
    system_instruction=system_prompt,
)
response = model.generate_content(prompt)
```

**Key differences:**

- No separate `client` object — `genai` is module-level configured
- `system_instruction` is a constructor parameter, not part of the message array
- No `cache_control` — Gemini uses a different context caching mechanism (requires `CachedContent` API)
- Usage metadata is under `response.usage_metadata` (`prompt_token_count`, `candidates_token_count`)
- Response text is `response.text` (not `response.content[0].text`)

### SDK Migration — Node.js

**Before (Anthropic):**

```javascript
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
const response = await client.messages.create({ ... });
```

**After (Gemini):**

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
	model: "gemini-2.5-flash-lite",
	systemInstruction: systemPrompt,
});
const result = await model.generateContent(prompt);
const response = result.response;
```

**Key differences:**

- SDK package: `@google/generative-ai` (not `@anthropic-ai/sdk`)
- Token counting: Gemini Node SDK does not expose a simple tokenizer; replaced `js-tiktoken` with character estimation (~4 chars/token)
- No `tiktoken` dependency needed
- Usage at `response.usageMetadata` (`promptTokenCount`, `candidatesTokenCount`)
- `response.text()` is a method, not a property

### Token Counting

| Library | Before                                  | After                                               |
| :------ | :-------------------------------------- | :-------------------------------------------------- |
| Python  | `tiktoken.encoding_for_model(...)`      | `genai.count_tokens(text).total_tokens`             |
| Node.js | `js-tiktoken` (`encodingForModel(...)`) | Character estimation (`Math.ceil(text.length / 4)`) |

### Removed Dependencies

| Before                            | After                                                       |
| :-------------------------------- | :---------------------------------------------------------- |
| `anthropic` / `@anthropic-ai/sdk` | `google-generativeai` / `@google/generative-ai`             |
| `tiktoken` / `js-tiktoken`        | None needed                                                 |
| Cache control headers             | Not applicable (Gemini context caching uses a separate API) |

### Dependency Installation

```bash
# Python
pip install google-generativeai

# Node.js
npm install @google/generative-ai
```

---

## 2. Cost Comparison: Anthropic vs. Gemini

### Per-Call Comparison

For a typical codebase explainer query (2,100 prompt tokens, 300 completion tokens):

| Provider                           |         Input Cost         |       Output Cost        |    Total     |
| :--------------------------------- | :------------------------: | :----------------------: | :----------: |
| **Anthropic** (claude-sonnet-4)    |  2,100 × $3/M = $0.00630   |  300 × $15/M = $0.00450  | **$0.01080** |
| **Gemini** (gemini-2.5-flash-lite) | 2,100 × $0.10/M = $0.00021 | 300 × $0.40/M = $0.00012 | **$0.00033** |
| **Savings**                        |          **30×**           |        **37.5×**         |   **~33×**   |

### Real-World Projection

If Groovy Web runs **5,000 queries/day** with average 2K prompt + 300 completion tokens:

| Scenario                       | Daily Cost     | Monthly Cost        |
| :----------------------------- | :------------- | :------------------ |
| Anthropic (claude-sonnet-4)    | $54.00         | $1,620.00           |
| Gemini (gemini-2.5-flash-lite) | $1.65          | $49.50              |
| **Savings**                    | **$52.35/day** | **$1,570.50/month** |

> [!NOTE]
> Gemini 2.5 Flash is optimized for low-latency, high-throughput use cases. For complex reasoning tasks, Gemini 2.5 Pro ($1.25/M input, $5.00/M output, $10/M output for long contexts) is the appropriate alternative.

---

## 3. Token Tracking Dashboard

### Architecture

```
token-tracker/
├── tracker.py      # CLI script — logs every API call to CSV
├── telemetry.csv   # Persistent CSV log (appended, never overwritten)
└── analysis.py     # Reads CSV and prints summary statistics
```

### `tracker.py` — Usage

```bash
# Log a call (from any script that uses the Gemini API)
python tracker.py \
  --model gemini-2.5-flash-lite \
  --prompt-tokens 2150 \
  --completion-tokens 320 \
  --cache-hit false

# Entry appended to telemetry.csv automatically
```

### `analysis.py` — Usage

```bash
python analysis.py
```

Output:

```
╔══════════════════════════════════════════╗
║        Token Tracking Dashboard          ║
╚══════════════════════════════════════════╝

Date range:      2026-06-18 to 2026-06-18
Total calls:     15
Total prompts:   3 unique (system prompt variants)

Cost Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total cost:               $0.0050
Avg cost per call:        $0.0003
Total w/out caching:      $0.0050
Cache savings:            0.0%

Token Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total prompt tokens:      31,500
Total completion tokens:  4,800
Avg tokens per call:      2,420
Avg prompt tokens:        2,100
Avg completion tokens:    320

Cache Performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cache hits:               0 / 15 (0%)
Cache read tokens:        0
Cache creation events:    3
```

---

## 4. CSV Telemetry Format

### Schema

```csv
timestamp,model,prompt_tokens,completion_tokens,cost,cache_hit,cache_read_tokens,cache_create_tokens,query_hash
```

### Field Descriptions

| Field                 | Type     | Description                                                  |
| :-------------------- | :------- | :----------------------------------------------------------- |
| `timestamp`           | ISO 8601 | UTC time of the API call                                     |
| `model`               | string   | Model identifier (e.g. `gemini-2.5-flash-lite`)              |
| `prompt_tokens`       | integer  | Total input tokens sent                                      |
| `completion_tokens`   | integer  | Output tokens generated                                      |
| `cost`                | float    | Calculated cost in USD (input at $0.10/M, output at $0.40/M) |
| `cache_hit`           | boolean  | Whether this call read from cache (Gemini context caching)   |
| `cache_read_tokens`   | integer  | Tokens served from cache                                     |
| `cache_create_tokens` | integer  | Tokens written to cache                                      |
| `query_hash`          | string   | SHA256 of (model + system prompt + first user message)       |

### Sample Data

```csv
timestamp,model,prompt_tokens,completion_tokens,cost,cache_hit,cache_read_tokens,cache_create_tokens,query_hash
2026-06-18T09:00:01Z,gemini-2.5-flash-lite,2100,280,0.000322,false,0,2100,a1b2c3d4e5
2026-06-18T09:00:15Z,gemini-2.5-flash-lite,2100,315,0.000336,false,0,0,a1b2c3d4e5
2026-06-18T09:00:32Z,gemini-2.5-flash-lite,2100,290,0.000326,false,0,0,a1b2c3d4e5
2026-06-18T09:01:05Z,gemini-2.5-flash-lite,2150,340,0.000351,false,0,0,b2c3d4e5f6
```

### Pricing Reference (gemini-2.5-flash-lite)

| Token Type                     |              Rate               |
| :----------------------------- | :-----------------------------: |
| Input                          |        $0.10 / M tokens         |
| Output                         |        $0.40 / M tokens         |
| Cached input (context caching) | $0.05 / M tokens (50% discount) |

---

## 5. Codebase Explainer Tool

### Overview

Two CLI tools (`explain.py` and `explain.js`) that accept a directory path and a question, then send relevant code context to Gemini and return a natural-language explanation.

### Design Decisions

| Decision           | Choice                                                 | Rationale                                                                                                                  |
| :----------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- |
| **Model**          | gemini-2.5-flash-lite                                  | 30–37× cheaper than Claude Sonnet; fast for code analysis                                                                  |
| **Max context**    | 10K tokens                                             | Keeps costs predictable (~$0.0003/query); forces smart file selection                                                      |
| **File selection** | By extension + size                                    | Only `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.json`, `.yaml`, `.md` files under 5 KB — avoids dumping binaries or huge files |
| **Truncation**     | Head + tail (pineapple strategy)                       | First 2K tokens of file + last 500 tokens preserves import signatures _and_ closing logic                                  |
| **Token counting** | `genai.count_tokens()` (Python) / char estimation (JS) | Eliminates tiktoken dependency                                                                                             |

### Usage

```bash
# Python
python explain.py /path/to/project "How does authentication work?"

# Node.js
node explain.js /path/to/project "What is the data model for users?"
```

### Sample Run

```
$ python codebase-explainer/explain.py ~/groovy/days/day-2/todo-app \
  "How does the frontend communicate with the backend?"

─────────────────────────────────────────────────────────
  Codebase Explainer
  Project: /home/naman/groovy/days/day-2/todo-app
  Question: How does the frontend communicate with the backend?
─────────────────────────────────────────────────────────

Files analyzed: 7 (9,128 tokens)

> The frontend (React app in `frontend/src/App.js`) communicates with
> the backend (Express server in `backend/server.js`) via direct HTTP
> calls using the browser `fetch()` API, all targeting
> `http://localhost:3001`.
>
> Key points:
> • The App component calls `fetch("http://localhost:3001/todos")` on
>   mount inside a useEffect hook.
> • New todos are POSTed to the same origin with JSON body.
> • Toggle and delete use PUT and DELETE respectively.
> • The backend stores data in-memory (array) and returns JSON.
> • No authentication, no WebSockets — simple CRUD over REST.
> • The `proxy` field in package.json is configured but NOT used
>   (all fetch URLs are hardcoded).

Model: gemini-2.5-flash-lite | Cost: $0.0003
```

---

## 6. Weekly Meetup — Week 2 Learnings

### Meetup Details

- **Date:** Thursday, June 18, 2026 — 4:00 PM
- **Location:** Narmada Room, 4th Floor
- **Attendees:** Naman, Krunal, Rahul, Nauman, Dhruti, Parth + 3 other trainees
- **Format:** Lightning talks (5 min each) + open discussion

### My Lightning Talk — "Cost-Aware AI Engineering"

Slides I prepared (5 min):

1. **Gemini is 30× cheaper than Claude** — demonstrated with live numbers ($0.10/M vs $3.00/M input)
2. **Token tracking is an accountability tool** — showed the CSV telemetry format
3. **The 10K context limit forces better file selection** — showed explainer tool
4. **SDK migration is straightforward** — showed side-by-side Python and JS comparisons

#### Audience Questions

> **Rahul:** "Does Gemini have an equivalent to Anthropic's prompt caching?"
>
> **Me:** "Yes — Google has Context Caching via the `CachedContent` API. It requires explicitly creating a cached content object with a TTL (min 20 minutes, max indefinite). The discount is ~50% on cached input tokens, vs Anthropic's 90% — but Gemini's base rate is already 30× cheaper, so the absolute savings are still better."

> **Nauman:** "What about quality differences between Gemini 2.5 Flash and Claude Sonnet?"
>
> **Me:** "For code explanation, they're comparable. Flash is faster and cheaper; Sonnet is slightly better at complex multi-step reasoning. The right strategy is multi-model routing — use Flash for 80% of tasks, Sonnet/Pro for the hard 20%."

> **Krunal:** "How do we enforce consistent telemetry logging across all scripts?"
>
> **Me:** "I'd suggest a decorator or middleware approach — wrap the SDK client at import time. For Gemini, you could monkeypatch `GenerativeModel.generate_content` to auto-log telemetry. One import, zero friction."

### Week 2 Learnings Shared

| Day       | Topic            | Key Learning                                                                                                                                        |
| :-------- | :--------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Day 5** | Advanced Prompts | Chain-of-thought prompting dramatically improves multi-step reasoning quality. Structured output (JSON mode) eliminates parsing errors.             |
| **Day 6** | Anthropic API    | System prompts + message history format are the key to stateful agents. Temperature controls creativity — use 0 for extraction, 0.7 for generation. |
| **Day 7** | OpenAI API       | Function calling (tools) enables AI to invoke real functions. Streaming reduces perceived latency by 3–4×.                                          |
| **Day 8** | Prompt Chaining  | Break complex tasks into sub-prompts. Each step validates output before passing to the next. Dramatically reduces hallucination in long operations. |
| **Day 9** | Gemini + Cost    | Gemini 2.5 Flash is 30× cheaper than Claude Sonnet. Token telemetry gives visibility into spend. SDK migration is straightforward.                  |

### Other Trainees' Talks

| Trainee   | Topic                | Takeaway                                                                                                                                             |
| :-------- | :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Riya**  | Multi-model routing  | Use a cheap model (Flash/Haiku) for simple tasks, expensive model (Sonnet/Pro) for complex reasoning. Saves 70% on total cost.                       |
| **Arjun** | Error recovery loops | When an AI-generated function fails tests, feed the error message back as a follow-up prompt. 90% of bugs resolved in 1–2 retries.                   |
| **Priya** | Prompt versioning    | Store prompts in Git with semantic versioning. Rollback is trivial. Tag prompt templates with metadata (model, temperature, expected output schema). |

---

## 7. Daily Reflection

> [!TIP]
> **Biggest takeaway:** Gemini 2.5 Flash changes the economics of AI engineering. A 2,100-token query costs **$0.00033** on Gemini vs. **$0.01080** on Claude Sonnet — a 33× reduction. At Groovy Web's scale (5K queries/day), that's ~$50/month vs. ~$1,600/month. Combined with multi-model routing (Riya's insight), the savings potential is enormous. The key skill is **thinking about cost from the first prompt**, not as an afterthought.

### Stats

| Metric                           | Value                                         |
| :------------------------------- | :-------------------------------------------- |
| Codebase explorer tools migrated | 2 (Python + Node.js)                          |
| Token tracking tools built       | 2 (tracker.py + analysis.py)                  |
| Cost reduction vs. Anthropic     | ~33× per query                                |
| Telemetry CSV entries today      | 15                                            |
| Files analyzed in test runs      | 7                                             |
| Meetup talks attended            | 1                                             |
| Week 2 learnings shared          | 5 (Days 5–9)                                  |
| Key takeaway                     | Model choice is the single biggest cost lever |

---

## Summary

Day 9 focused on migrating from Anthropic's Claude to Google's Gemini 2.5 Flash and measuring the cost impact. I rewrote the codebase explainer tools in Python and Node.js to use the `google-generativeai` / `@google/generative-ai` SDKs, replaced `tiktoken` with Gemini's native token counting, and updated the token tracking dashboard. The result: **~33× cost reduction** on every query, with comparable code explanation quality. At the weekly meetup, I shared these findings alongside Week 2 learnings from Days 5–9. The bottom line: **model choice is the single biggest cost lever in AI engineering**.

**Tomorrow (Day 10):** Vector embeddings + RAG — building a knowledge base chatbot.
