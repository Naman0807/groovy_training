# GroovyBot v2 — Production CLI Chatbot

**Day 8 — Streaming · Async · Production Hygiene**

Production-grade CLI chatbot using the **Google Gemini API**. Adds
streaming output, retry logic with exponential backoff, token counting, and
client-side rate limiting.

---

## Files

| File                | Description                                                                  |
| :------------------ | :--------------------------------------------------------------------------- |
| `cli.py`            | Main entry point — streaming chatbot with retry, rate limiting, token budget |
| `streaming_demo.py` | Standalone streaming chunk demo — shows every raw chunk from Gemini          |
| `token_counter.py`  | Token counting utility (Gemini API count_tokens with fallback)               |
| `requirements.txt`  | Python dependencies                                                          |
| `README.md`         | This file                                                                    |

---

## Production Features

### 1. Streaming Output

Responses are streamed **character-by-character** instead of buffering the full
response. The user sees output start in ~300ms instead of waiting 3-5s.

```python
# cli.py — streaming with the Gemini API
response = model.generate_content(contents=[...], stream=True)
for chunk in response:
    if chunk.text:
        print(chunk.text, end="", flush=True)
```

### 2. Retry with Exponential Backoff

Transient failures (rate limits, server errors) are retried automatically with
increasing delays: **1s → 2s → 4s** (±0.5s random jitter).

| Attempt | Delay | Jitter Range |
| :------ | :---- | :----------- |
| 1       | 1.0s  | 0.5–1.5s     |
| 2       | 2.0s  | 1.5–2.5s     |
| 3       | 4.0s  | 3.5–4.5s     |

After 3 failed attempts the error is surfaced to the user.

### 3. Token Counting

Counts tokens _before_ sending a request using Gemini's built-in `count_tokens`:

```
Pre-flight: "What is the capital of France?" = 7 tokens
Budget: 995,904 / 1,000,000 tokens used (4,096 reserved for output)
```

The standalone `token_counter.py` utility uses the Gemini API when available,
falling back to a ~4-char-per-token heuristic.

### 4. Rate Limit Handling

**Two-layer defence:**

1. **Client-side rate limiter** — sliding window (10 calls / 60s) prevents
   hitting API limits before they happen.
2. **Retry with backoff** — if a 429 still comes through, retry up to 3 times
   with exponential delay.

### 5. Token Budget Management

Gemini 2.5 Flash has a 1M token context window. The chatbot reserves 4K for the
response, leaving ~996K for input. If a message would exceed the budget, the
oldest history entries are popped until it fits.

---

## Setup

### 1. API Key

```bash
export GEMINI_API_KEY="AIzaSy..."
```

Or create a `.env` file:

```
GEMINI_API_KEY=AIzaSy...
```

### 2. Install

```bash
pip install -r requirements.txt
```

### 3. Run

```bash
# Main chatbot (streaming, retry, token counting)
python cli.py

# Streaming chunk demo
python streaming_demo.py

# Count tokens in a prompt
python token_counter.py "What is the capital of France?"
python token_counter.py --file long_document.txt
```

---

## Usage

```bash
$ python cli.py
╭──────────────────────────────────────────────╮
│  🤖 GroovyBot v2 — Production CLI Chatbot  │
│  🔄 Streaming  ⏱ Retry  📊 Token counter  │
│  Type 'exit' or 'quit' to end              │
╰──────────────────────────────────────────────╯

You: Write a haiku about streaming

── GroovyBot ──────────────────────────────────
Tokens flow like streams
Character by character
The response appears

📊  +11 in  +14 out  │  Session: 11 in  14 out

You: exit
Goodbye!
```

---

## Comparison: Day 6 vs Day 8

| Feature            | Day 6 (Basic)    | Day 8 (Production v2)               |
| :----------------- | :--------------- | :---------------------------------- |
| Output             | Buffered         | **Streaming** — char-by-char        |
| Retry              | None             | **Exponential backoff** (1s→2s→4s)  |
| Token counting     | None             | **Pre-flight + budget enforcement** |
| Rate limiting      | None             | **Client-side sliding window**      |
| Error handling     | Basic try/except | **Layered** — retry vs surface      |
| History management | Unbounded        | **Token-budget-aware trimming**     |
| Architecture       | Single file      | **Modular** (cli + token_counter)   |

---

## Notes

- Model: `gemini-2.5-flash-lite` (configurable in `cli.py:MODEL_NAME`)
- Max output tokens: 4,096 (configurable in `cli.py:MAX_TOKENS`)
- Rate limit: 10 requests / 60s sliding window (configurable in `cli.py:RATE_LIMIT`)
- Retry: 3 attempts, 1.0s base delay, 0.5s jitter (configurable in `cli.py:RETRY_CONFIG`)
- Environment variable: `GEMINI_API_KEY`
