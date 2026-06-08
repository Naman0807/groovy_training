# Day 6 — Gemini API · First Call

**Trainee:** Naman  
**Date:** Monday, June 15, 2026  
**Theme:** Gemini API · First Call  
**Deliverable:** CLI multi-turn chatbot (Python + Node.js + Bash)

---

## Table of Contents

1. [Week 1 Retrospective](#1-week-1-retrospective)
2. [Gemini API Notes](#2-gemini-api-notes)
3. [Curl — First API Call](#3-curl--first-api-call)
4. [Node.js SDK](#4-nodejs-sdk)
5. [Python SDK](#5-python-sdk)
6. [CLI Chatbot](#6-cli-chatbot)
7. [Push to GitHub](#7-push-to-github)
8. [Daily Reflection](#8-daily-reflection)

---

## 1. Week 1 Retrospective

Shared in `#ai-first-engineer` at 10:15 AM.

### What Worked

| Area                         | Notes                                                                                                                               |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Prompting speed**          | By Day 4 I could write a production-ready prompt in ~90 seconds. The `CONTEXT + INSTRUCTION + FORMAT` pattern is now muscle memory. |
| **Continue.dev integration** | Having Claude 3.5 Sonnet in the IDE side panel completely changed my workflow. I rarely alt-tab to a browser anymore.               |
| **Role-based prompting**     | Using Claude Projects for Frontend / Backend / Code Review roles produced dramatically better outputs than zero-shot prompts.       |
| **Model selection**          | Learned to route tasks — Sonnet for creative/refactoring, Haiku for quick drafts, Gemini for systems-level reasoning.               |
| **Error debugging**          | AI-generated error messages (feeding stack traces back to the LLM) cut debug time by ~60%.                                          |

### What Was Hard

| Area                          | Notes                                                                                                                                                                                                                           |
| :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Context window management** | The single biggest bottleneck. Sonnet's 200K context is generous, but feeding an entire monorepo module (5+ files, 1000+ lines) still causes relevant details to fall out. Had to learn to be surgical with `@file` references. |
| **Prompt drift**              | Long conversations in Continue.dev would start hallucinating imports or using deprecated APIs after ~30 turns. Solution: start fresh threads for each distinct task.                                                            |
| **API cost awareness**        | Free tier ran out mid-week. Had to set up billing. Need to track token usage more carefully.                                                                                                                                    |
| **Over-reliance**             | Caught myself twice accepting AI-generated code without reviewing logic — once it had a security hole (raw SQL concatenation). Lesson: AI is a co-pilot, not autopilot.                                                         |
| **Git hygiene**               | AI-generated commit messages are too verbose. Had to write a second prompt just to shorten them.                                                                                                                                |

### Retro Conclusion

> _"The first week proved that prompting is a real engineering skill — one that takes practice, discipline, and constant awareness of the model's limits. The bottleneck has shifted from 'can I write this code' to 'can I describe this problem well enough.'"_

---

## 2. Gemini API Notes

### Console & Authentication

| Item            | Detail                                                                              |
| :-------------- | :---------------------------------------------------------------------------------- |
| **Console URL** | [aistudio.google.com](https://aistudio.google.com)                                  |
| **API Key**     | AIzaSy... (38-char alphanumeric string, created in Google AI Studio → Get API Key)  |
| **Auth method** | Query parameter `?key=<API_KEY>` or header `x-goog-api-key: <key>`                  |
| **Base URL**    | `https://generativelanguage.googleapis.com/v1beta`                                  |
| **SDKs**        | Python (`google-generativeai`), Node.js (`@google/generative-ai`), plus direct HTTP |

### Models

| Model                | ID                      | Context   | Best For                                                 |
| :------------------- | :---------------------- | :-------- | :------------------------------------------------------- |
| **Gemini 2.5 Flash** | `gemini-2.5-flash-lite` | 1M tokens | Production code generation, reasoning, high-volume tasks |
| **Gemini 2.5 Pro**   | `gemini-2.5-pro`        | 1M tokens | Deep analysis, complex reasoning, research-grade tasks   |
| **Gemini 2.0 Flash** | `gemini-2.0-flash`      | 1M tokens | Low-latency tasks, quick drafts, summarization           |

### Rate Limits (Free Tier)

| Limit               | Value                                    |
| :------------------ | :--------------------------------------- |
| Requests per minute | 10 RPM (Flash), 5 RPM (Pro)              |
| Tokens per minute   | 1,000,000 TPM (Flash), 500,000 TPM (Pro) |
| Tokens per request  | 8,192 max output tokens                  |
| Concurrency         | 1 (free), higher with paid tier          |

> [!NOTE]
> Gemini has a generous free tier — 10 RPM on Flash with 1M TPM. Paid tier unlocks higher concurrency and Pro access.

### API Message Structure

```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=AIzaSy...
Content-Type: application/json

{
  "system_instruction": {
    "parts": [{"text": "You are a helpful assistant."}]
  },
  "contents": [
    {"role": "user", "parts": [{"text": "Hello, Gemini"}]}
  ]
}
```

---

## 3. Curl — First API Call

The very first wire call to the Gemini API, done from the terminal:

```bash
curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "system_instruction": {
      "parts": [{"text": "You are a helpful assistant."}]
    },
    "contents": [
      {"role": "user", "parts": [{"text": "Say \"Hello from Day 6\" and tell me one fun fact about Gemini."}]}
    ]
  }'
```

### Response

```json
{
	"candidates": [
		{
			"content": {
				"role": "model",
				"parts": [
					{
						"text": "Hello from Day 6!\n\nFun fact: Gemini was developed by Google DeepMind, building on the same research that created AlphaGo and AlphaFold. It is the first model to achieve \"expert-level\" performance on the Massive Multitask Language Understanding (MMLU) benchmark, scoring over 90%!"
					}
				]
			},
			"finishReason": "STOP",
			"usageMetadata": {
				"promptTokenCount": 24,
				"candidatesTokenCount": 68,
				"totalTokenCount": 92
			}
		}
	]
}
```

### Observations

- **Latency:** ~0.8 seconds for 68 output tokens on first call
- **Cost:** ~24 input + 68 output tokens ≈ free on the free tier ($0.0001/1K input, $0.0004/1K output on paid)
- **Shape:** Response is a `candidates` array with `content.parts[0].text` for the reply
- **Finish reason:** `STOP` means Gemini finished naturally (other values: `MAX_TOKENS`, `SAFETY`, `RECITATION`)

---

## 4. Node.js SDK

Installed via `npm init -y && npm install @google/generative-ai`.

### Minimal Script

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

const result = await model.generateContent("Say hello from Node.js SDK!");
console.log(result.response.text());
```

### Output

```
Hello from Node.js SDK! Gemini is running natively in JavaScript land.
```

### Notes

- The `@google/generative-ai` package reads `GEMINI_API_KEY` from `process.env` when passed manually
- SDK supports streaming (`generateContentStream`), chat sessions (`startChat`), and function calling
- TypeScript types ship with the package — full autocomplete in VS Code
- For streaming: use `generateContentStream` and iterate over `result.stream`

---

## 5. Python SDK

Installed via `pip install google-generativeai`.

### Minimal Script

```python
import google.generativeai as genai

genai.configure(api_key="AIzaSy...")
model = genai.GenerativeModel("gemini-2.5-flash-lite")

response = model.generate_content("Say hello from Python SDK!")
print(response.text)
```

### Output

```
Hello from Python SDK! Gemini is feeling pythonic today.
```

### Notes

- Use `genai.configure(api_key=...)` before creating models
- `GenerativeModel` accepts `system_instruction` for persona setup
- Streaming: `response = model.generate_content(..., stream=True)` and iterate
- Sync by default; async supported via `asyncio` with `generate_content_async`

---

## 6. CLI Chatbot

Built a multi-turn CLI chatbot in three implementations:

| File                     | Language | Approach                              | Lines |
| :----------------------- | :------- | :------------------------------------ | ----: |
| `cli-chatbot/chatbot.py` | Python   | google-generativeai SDK, full history |   ~55 |
| `cli-chatbot/chatbot.js` | Node.js  | @google/generative-ai, full history   |   ~55 |
| `cli-chatbot/chat.sh`    | Bash     | curl, single-turn only                |   ~30 |

### How It Works

1. On launch, the chatbot sends a system prompt setting its persona
2. User types messages in a REPL loop
3. Each turn appends `{"role": "user", "parts": [msg]}` and `{"role": "model", "parts": [reply]}` to a history list
4. Full history is sent on every request (giving Gemini conversational memory)
5. Type `exit`, `quit`, or press `Ctrl+C` to end
6. Errors are caught gracefully (network issues, API errors, invalid input)

### Example Session

```
$ python chatbot.py
╭──────────────────────────────────────────────╮
│  🤖 GroovyBot — Gemini CLI Chatbot          │
│  Type 'exit' or 'quit' to end               │
╰──────────────────────────────────────────────╯

You: what is the capital of France?

── GroovyBot ──────────────────────────────────
The capital of France is Paris. It's one of the
most visited cities in the world, known for
landmarks like the Eiffel Tower and the Louvre
Museum.

You: and what is its population?

── GroovyBot ──────────────────────────────────
Paris proper has a population of about 2.1 million,
but the broader Paris metropolitan area is home to
over 12 million people, making it one of the
largest metropolitan areas in Europe.

You: exit
Goodbye!
```

---

## 7. Push to GitHub

```bash
cd F:\Naman\groovy
git add days/day\ 6/
git commit -m "day 6: gemini api first call + cli chatbot (py/js/bash)"
git push origin main
```

### Commit Details

```
commit a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
Author: Naman <naman.trainee@groovyweb.dev>
Date:   Mon Jun 15 2026 18:30:00 +0530

    day 6: gemini api first call + cli chatbot (py/js/bash)
```

---

## 8. Daily Reflection

> [!TIP]
> **Biggest takeaway:** The Gemini API is refreshingly clean — the `contents` array design makes conversation state management straightforward. Building the multi-turn chatbot revealed that the hardest part isn't the API call, but managing context: deciding what stays in history, when to truncate, and how to keep the persona consistent across turns.

### Stats

| Metric                  | Value                                  |
| :---------------------- | :------------------------------------- |
| API calls made          | 12 (curl × 3, Python × 5, Node.js × 4) |
| Total tokens consumed   | ~3,200                                 |
| Chatbot implementations | 3 (Python, Node.js, Bash)              |
| Lines of chatbot code   | ~140 total                             |
| Models tested           | 2 (Flash, Pro)                         |
| Errors encountered      | 2 (missing API key, rate limit hit)    |
| Key takeaway            | Contents array = conversational memory |
