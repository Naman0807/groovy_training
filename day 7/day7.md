# Day 7 — Google Gemini API · CLI Integration

**Trainee:** Naman
**Date:** Tuesday, June 16, 2026  
**Theme:** Google Gemini API  
**Deliverable:** Gemini CLI chatbot + cost analysis + model decision matrix

---

## Table of Contents

1. [Google Gemini API — Setup & Basics](#1-google-gemini-api--setup--basics)
2. [Gemini SDK — Chat & System Instructions](#2-gemini-sdk--chat--system-instructions)
3. [Building the Gemini CLI Chatbot](#3-building-the-gemini-cli-chatbot)
4. [50-Prompt Cost Analysis (Gemini 2.5 Flash)](#4-50-prompt-cost-analysis-gemini-25-flash)
5. [Gemini Model Decision Matrix](#5-gemini-model-decision-matrix)
6. [Daily Reflection](#6-daily-reflection)

---

## 1. Google Gemini API — Setup & Basics

### Console & Authentication

| Item        | Detail                                                      |
| :---------- | :---------------------------------------------------------- |
| **Console** | [aistudio.google.com](https://aistudio.google.com)          |
| **API Key** | AIza... 39-char alphanumeric (from AI Studio → Get API Key) |
| **Auth**    | `genai.configure(api_key=...)`                              |
| **SDK**     | `google-generativeai>=0.8.0` (Python)                       |
| **Env var** | `GEMINI_API_KEY`                                            |

### Key Concepts

| Concept                | Description                                                                                      |
| :--------------------- | :----------------------------------------------------------------------------------------------- |
| **GenerativeModel**    | Main class — instantiated with model name and optional `system_instruction`                      |
| **generate_content()** | Core method — accepts text, images, or conversation history                                      |
| **Parts array**        | Gemini uses `{"role": "...", "parts": ["text"]}` instead of `{"role": "...", "content": "text"}` |
| **Role: "model"**      | The AI's role is `"model"`, not `"assistant"`                                                    |
| **system_instruction** | Constructor parameter — set once per model instance, not per-request                             |

### Hello World Example

```python
import google.generativeai as genai

genai.configure(api_key="AIza...")
model = genai.GenerativeModel("gemini-2.5-flash-lite")
response = model.generate_content("Hello!")
print(response.text)
```

### Models Available

| Model            | ID                      | Cost (Input / 1M) | Cost (Output / 1M) | Context | Best For                                    |
| :--------------- | :---------------------- | :---------------- | :----------------- | :------ | :------------------------------------------ |
| Gemini 2.5 Flash | `gemini-2.5-flash-lite` | $0.10             | $0.40              | 1M      | Cost-sensitive, high-throughput, multimodal |
| Gemini 2.5 Pro   | `gemini-2.5-pro`        | $1.25             | $5.00              | 2M      | Complex code, reasoning, quality            |
| Gemini 2.5 Ultra | `gemini-2.5-ultra`      | $5.00             | $15.00             | 2M      | Research-grade accuracy, benchmarks         |

---

## 2. Gemini SDK — Chat & System Instructions

### System Instructions

Gemini handles system prompts differently than other providers:

```python
model = genai.GenerativeModel(
    "gemini-2.5-flash-lite",
    system_instruction="You are a helpful CLI assistant."
)
```

The `system_instruction` is baked into the model instance. It is not passed per-request.

### Chat History Format

Gemini's history uses `{"role": "...", "parts": [...]}` format:

```python
history = [
    {"role": "user", "parts": ["What is the capital of France?"]},
    {"role": "model", "parts": ["Paris."]},
    {"role": "user", "parts": ["What is its population?"]},
]

response = model.generate_content(history)
print(response.text)
```

**Key differences from other APIs:**

- Role is `"model"` not `"assistant"`
- Content is in `"parts"` array not `"content"` string
- Response text is accessed via `response.text` not `response.content[0].text`

### Error Handling

```python
try:
    response = model.generate_content(prompt)
    return response.text
except Exception as e:
    return f"Error: Gemini API error — {e}"
```

---

## 3. Building the Gemini CLI Chatbot

### Architecture

```
multi-cli/
├── cli.py                                  ← Entry point — main REPL loop
├── providers/
│   ├── __init__.py
│   └── gemini_provider.py                  ← Gemini SDK wrapper
├── requirements.txt
├── cost_report.csv
├── decision_matrix.md
└── README.md
```

### CLI Flow

1. Load `GEMINI_API_KEY` from `.env` or environment
2. Configure `genai` and create `GenerativeModel` with `system_instruction`
3. Start a REPL loop that collects user input
4. Append user input to history as `{"role": "user", "parts": [text]}`
5. Call `model.generate_content(history)` and extract `response.text`
6. Append model reply to history as `{"role": "model", "parts": [text]}`
7. Print colored output

### Implementation (`cli.py`)

```python
import os
import google.generativeai as genai

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
model = genai.GenerativeModel(
    "gemini-2.5-flash-lite",
    system_instruction="You are a helpful CLI assistant."
)

history = []
while True:
    user_input = input("You: ").strip()
    if user_input.lower() in ("exit", "quit"):
        break
    history.append({"role": "user", "parts": [user_input]})
    response = model.generate_content(history)
    reply = response.text
    history.append({"role": "model", "parts": [reply]})
    print(f"Gemini: {reply}")
```

### Provider Wrapper (`gemini_provider.py`)

The provider class wraps the Gemini SDK with a `send_message(messages)` interface:

- Accepts a history list (standardized `{role, content}` format)
- Converts `"assistant"` roles to `"model"`
- Wraps content in `parts` arrays
- Returns response text or error string

---

## 4. 50-Prompt Cost Analysis (Gemini 2.5 Flash)

### Methodology

- 50 prompts across 5 categories: general knowledge, coding, explanation, creative, technical
- Priced using Gemini 2.5 Flash rates: **$0.10/1M input tokens, $0.40/1M output tokens**
- Token counts estimated from actual prompt + response length

### Results

| Metric                  | Gemini 2.5 Flash |
| :---------------------- | ---------------: |
| **Total Input Tokens**  |            1,360 |
| **Total Output Tokens** |            3,280 |
| **Total Cost**          |     **$0.00021** |
| **Avg Cost / Prompt**   |        $0.000004 |
| **Input Cost Share**    |   $0.00014 (65%) |
| **Output Cost Share**   |   $0.00007 (35%) |

### Key Takeaways

- Gemini 2.5 Flash is extremely cost-efficient at $0.10/M input tokens
- At scale (10,000 prompts/day): ~$0.04/day — viable for high-volume production
- Output cost is only $0.40/M tokens, making it ideal for long-form generation
- The 1M context window allows entire codebases or books in a single request

### Full Data

See `multi-cli/cost_report.csv` for the complete per-prompt breakdown (50 rows with input/output tokens and cost).

---

## 5. Gemini Model Decision Matrix

See `multi-cli/decision_matrix.md` for the full interactive guide. Summary:

### When to Choose

| Model                | Best For                                               | Cost Tier |
| :------------------- | :----------------------------------------------------- | :-------- |
| **Gemini 2.5 Flash** | Cost-sensitive, high volume, multimodal, large context | $         |
| **Gemini 2.5 Pro**   | Complex code, reasoning, balanced quality              | $$        |
| **Gemini 2.5 Ultra** | Research, benchmarks, maximum accuracy                 | $$$       |

### Quick Rules of Thumb

1. **On a tight budget?** → Gemini 2.5 Flash (~$0.10/M input)
2. **Processing images or audio?** → Gemini 2.5 Flash (cheapest multimodal)
3. **Writing complex code?** → Gemini 2.5 Pro (superior reasoning)
4. **Need maximum accuracy?** → Gemini 2.5 Ultra (top benchmarks)
5. **Analyzing a large document?** → Gemini 2.5 Flash (1M context)

---

## 6. Daily Reflection

> [!TIP]
> **Biggest takeaway:** The Gemini SDK is refreshingly simple — `GenerativeModel` and `generate_content()` handle everything from single prompts to multi-turn conversations to multimodal inputs. The `system_instruction` parameter on the constructor (rather than per-request) changes the mental model but keeps code clean. Google's pricing is aggressively cheap: Gemini 2.5 Flash at $0.10/M input tokens is the most cost-effective production model available, while 2.5 Pro and Ultra offer competitive quality for demanding workloads.

### Stats

| Metric                     | Value                                                       |
| :------------------------- | :---------------------------------------------------------- |
| Provider                   | Google Gemini (sole provider)                               |
| SDK                        | `google-generativeai>=0.8.0`                                |
| Model                      | `gemini-2.5-flash-lite`                                     |
| CLI files                  | 1 (`cli.py`)                                                |
| Provider files             | 1 (`gemini_provider.py`)                                    |
| Cost data points           | 50 prompts                                                  |
| Models analyzed            | 3 (Flash, Pro, Ultra)                                       |
| Decision matrix dimensions | 3 (quality, performance, cost)                              |
| Key takeaway               | Simple SDK + aggressive pricing = ideal for production chat |
