# Day 8 — Streaming · Async · Production Hygiene

**Trainee:** Naman  
**Date:** Wednesday, June 17, 2026  
**Theme:** Streaming · Async · Production Hygiene  
**Deliverable:** Production CLI Bot v2 with streaming, retry, token counting

---

## Table of Contents

1. [Gemini Streaming & SSE Learning Notes](#1-gemini-streaming--sse-learning-notes)
2. [Async Patterns Comparison](#2-async-patterns-comparison)
3. [Error Handling Strategy](#3-error-handling-strategy)
4. [Production CLI Bot v2](#4-production-cli-bot-v2)
5. [Code Review Feedback (Krunal)](#5-code-review-feedback-krunal)
6. [Daily Reflection](#6-daily-reflection)

---

## 1. Gemini Streaming & SSE Learning Notes

### What is SSE?

Server-Sent Events (SSE) is a standard (`EventSource` API) that allows a server to push data to a client over a single HTTP connection. Unlike WebSockets (bidirectional), SSE is **unidirectional — server to client only**.

### How It Works (Gemini API)

The Gemini API uses SSE under the hood for streaming responses. Each chunk of generated text arrives as a separate SSE message over the same HTTP connection.

```
Client                         Gemini API Server
  |                              |
  |-- POST /v1beta/models/ --->|  (streamGeneration: true)
  |   gemini-2.5-flash-lite:        |
  |   streamGenerateContent    |
  |                              |
  |<-- HTTP 200 -----------------|  (Content-Type: text/event-stream)
  |<-- data: {"candidates":...}  |  (chunk 1 — first text delta)
  |<-- data: {"candidates":...}  |  (chunk 2 — next text delta)
  |<-- data: {"candidates":...}  |  (chunk 3 — next text delta)
  |<-- data: {"candidates":...}  |  (final chunk — finish_reason)
  |                              |  (connection closes)
```

### SSE Event Format (Gemini)

```
data: {"candidates":[{"content":{"parts":[{"text":"Hello"}],"role":"model"},"finish_reason":"STOP","safety_ratings":[...]}],"usage_metadata":{...}}
```

### Gemini Streaming Chunks

Unlike Anthropic's multi-event stream (message_start, content_block_start, content_block_delta, etc.), Gemini's streaming is simpler — each chunk contains the next text delta directly.

| Chunk Property                 | What It Contains                                                    |
| :----------------------------- | :------------------------------------------------------------------ |
| `text`                         | The text delta for this chunk                                       |
| `candidates[0].finish_reason`  | `STOP`, `MAX_TOKENS`, `SAFETY`, `RECITATION`, or unset (mid-stream) |
| `candidates[0].safety_ratings` | Per-category safety assessment (block probability)                  |
| `usage_metadata`               | Token counts (usually only on final chunk)                          |

### SDK Usage (Python)

```python
import google.generativeai as genai

genai.configure(api_key="AIza...")
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-lite",
    system_instruction="You are a helpful assistant.",
)

response = model.generate_content(
    contents=[{"role": "user", "parts": [{"text": "Hello"}]}],
    stream=True,
)

for chunk in response:
    if chunk.text:
        print(chunk.text, end="", flush=True)
```

### Why Streaming Matters in Production

| Benefit                 | Explanation                                                                   |
| :---------------------- | :---------------------------------------------------------------------------- |
| **Perceived latency**   | Users see output starting in ~300ms instead of waiting 3-5s for full response |
| **Memory efficiency**   | No need to buffer the entire response — process tokens as they arrive         |
| **Early cancellation**  | Users can stop generation mid-way, saving tokens and cost                     |
| **Progress indicators** | Real-time token count or timing feedback in UI                                |

### Key Takeaways

- Gemini streaming uses SSE under the hood — the SDK abstracts this away
- Just set `stream=True` on `generate_content()` and iterate over chunks
- Each chunk's `text` attribute contains the text delta; concatenate for full response
- No context manager needed (unlike Anthropic) — the iterator handles cleanup
- Check `chunk.candidates[0].finish_reason` on the last chunk to see why generation stopped

---

## 2. Async Patterns Comparison

### Python asyncio vs Node.js async/await

| Aspect                    | Python asyncio                                                  | Node.js async/await                                     |
| :------------------------ | :-------------------------------------------------------------- | :------------------------------------------------------ |
| **Runtime**               | `asyncio` event loop (single-threaded cooperative multitasking) | libuv event loop (single-threaded, non-blocking I/O)    |
| **Keyword**               | `async def`, `await`                                            | `async function`, `await`                               |
| **Run entry point**       | `asyncio.run(main())`                                           | Top-level `await` or `main().catch(console.error)`      |
| **Concurrency primitive** | `asyncio.gather()`, `asyncio.create_task()`                     | `Promise.all()`, `Promise.race()`                       |
| **HTTP client**           | `httpx.AsyncClient()`, `aiohttp`                                | `fetch()`, `axios`                                      |
| **Streaming**             | `async for` over async iterators                                | `for await...of` over `ReadableStream`                  |
| **Error handling**        | `try/except` in async functions                                 | `try/catch` in async functions                          |
| **Timeout**               | `asyncio.wait_for(coro, timeout)`                               | `AbortController` + `AbortSignal`                       |
| **Backpressure**          | `asyncio.Queue(maxsize=N)`                                      | Stream `highWaterMark`, backpressure built into streams |
| **Thread pool**           | `loop.run_in_executor()` for CPU-bound work                     | `worker_threads` for CPU-bound work                     |
| **Ecosystem maturity**    | Mature but slightly clunky (3.10+ improved)                     | Mature and ergonomic (baked in since Node 7.6)          |

### Code Comparison — Streaming HTTP

**Python:**

```python
async def stream_response():
    async with httpx.AsyncClient() as client:
        async with client.stream("POST", url, json=payload) as resp:
            async for chunk in resp.aiter_bytes():
                process(chunk)
```

**Node.js:**

```javascript
async function streamResponse() {
	const resp = await fetch(url, {
		method: "POST",
		body: JSON.stringify(payload),
	});
	for await (const chunk of resp.body) {
		process(chunk);
	}
}
```

### Practical Decision Guide

| Use Case                            | Python                                   | Node.js                                   |
| :---------------------------------- | :--------------------------------------- | :---------------------------------------- |
| **Data pipeline / ETL**             | ✅ asyncio + aiohttp (native coroutines) | ❌ Awkward for CPU-heavy transforms       |
| **Real-time web server**            | ⚠️ Fast enough but ecosystem smaller     | ✅ Express/koa + streams (battle-tested)  |
| **CLI tool with streaming**         | ✅ Simple `for` loop over Gemini stream  | ✅ Also simple, slightly cleaner syntax   |
| **Microservices (high throughput)** | ⚠️ GIL limits parallelism                | ✅ Better for many concurrent connections |
| **WSGI/ASGI web apps**              | ✅ Starlette/FastAPI + async handlers    | ✅ Next.js API routes, Express            |

---

## 3. Error Handling Strategy

### Layers of Defence

```
User Input
    │
    ▼
[Layer 1] Input Validation — reject empty/non-string/null inputs
    │
    ▼
[Layer 2] Token Counting — warn if message exceeds context window
    │
    ▼
[Layer 3] Client-side Rate Limiter — prevent hitting API limits
    │
    ▼
[Layer 4] Retry with Exponential Backoff — 3 retries: 1s → 2s → 4s
    │      ├─ ResourceExhausted → retry (429 rate limit)
    │      ├─ ServiceUnavailable → retry (503 server error)
    │      └─ GoogleAPIError (other) → surface to user, no retry
    │
    ▼
[Layer 5] Streaming Error Handling — catch mid-stream failures
    │
    ▼
[Layer 6] Graceful Shutdown — Ctrl+C, EOF, proper cleanup
```

### Exponential Backoff Implementation

```python
from google.api_core import exceptions as google_exceptions

def retry_with_backoff(func, max_retries=3, base_delay=1.0):
    """Retry with exponential backoff: 1s, 2s, 4s."""
    for attempt in range(max_retries + 1):
        try:
            return func()
        except google_exceptions.ResourceExhausted:
            if attempt == max_retries:
                raise
            delay = base_delay * (2 ** attempt)
            time.sleep(delay)
        except google_exceptions.ServiceUnavailable:
            if attempt == max_retries:
                raise
            delay = base_delay * (2 ** attempt)
            time.sleep(delay)
```

### Jitter Consideration

Production systems should add **jitter** to prevent thundering herd:

```python
import random
delay = base_delay * (2 ** attempt) + random.uniform(0, 0.5)
```

Not added to the CLI bot (single user) but noted here for reference.

### Rate Limit Strategy

| Scenario                         | Action                                              |
| :------------------------------- | :-------------------------------------------------- |
| **HTTP 429 (ResourceExhausted)** | Backoff and retry (up to 3 times)                   |
| **Near limit (preemptive)**      | Client-side rate limiter tracks calls/min and waits |
| **Connection timeout**           | Retry with backoff (network blip)                   |
| **Invalid request (400)**        | Don't retry — surface error to user                 |
| **Auth error (401/403)**         | Don't retry — tell user to check API key            |
| **Server error (500/503)**       | Retry once, then surface                            |
| **Mid-stream disconnect**        | Reconnect and re-send last message (idempotency)    |

### Token Budget Management

```python
MAX_CONTEXT_TOKENS = 1_000_000  # Gemini 2.5 Flash context window
RESERVED_OUTPUT_TOKENS = 4096
MAX_INPUT_TOKENS = MAX_CONTEXT_TOKENS - RESERVED_OUTPUT_TOKENS

def count_tokens(text):
    return model.count_tokens(text).total_tokens

def enforce_token_budget(history, new_message):
    total = count_tokens(new_message)
    for msg in reversed(history):
        total += count_tokens(msg["content"])
        if total > MAX_INPUT_TOKENS:
            history.pop(0)
```

---

## 4. Production CLI Bot v2

Located in [`prod-cli/`](./prod-cli/).

| File                | Purpose                                                             |
| :------------------ | :------------------------------------------------------------------ |
| `cli.py`            | Main entry — streaming output, retry, rate limiting, token counting |
| `streaming_demo.py` | Standalone Gemini streaming chunk demo                              |
| `token_counter.py`  | Utility — count tokens in prompts before sending                    |
| `requirements.txt`  | Dependencies (google-generativeai)                                  |
| `README.md`         | Documentation of production features                                |

### What's New vs Day 6

| Feature                | Day 6 (Basic)                                   | Day 8 (Production v2)                                        |
| :--------------------- | :---------------------------------------------- | :----------------------------------------------------------- |
| **Output**             | Buffered — full response printed at once        | **Streaming** — character-by-character                       |
| **Retry**              | None (failed silently or required manual retry) | **Exponential backoff** — 3 retries (1s, 2s, 4s)             |
| **Token counting**     | None                                            | **Pre-flight** — counts tokens before sending via Gemini API |
| **Rate limiting**      | None                                            | **Client-side limiter** — prevents 429s                      |
| **Error handling**     | Basic try/except                                | **Layered** — retries network issues, surfaces others        |
| **Context management** | Full unbounded history                          | **Token budget enforcement** — pops oldest when over limit   |
| **Architecture**       | Single script                                   | **Modular** — utilities separated into modules               |

---

## 5. Daily Reflection

> [!TIP]
> **Biggest takeaway:** Streaming fundamentally changes the user's experience of latency. Even with identical total generation time, character-by-character output feels 3-4x faster than buffered output. The retry pattern with exponential backoff is universally applicable — every distributed system needs it.

### Stats

| Metric                    | Value                                               |
| :------------------------ | :-------------------------------------------------- |
| Streaming demos built     | 2 (standalone Gemini chunk demo + integrated CLI)   |
| Retry strategies explored | 3 (fixed, exponential, exponential+jitter)          |
| Async patterns compared   | 2 (Python asyncio vs Node.js async/await)           |
| Code review issues raised | 5 (2 high, 2 medium, 1 low)                         |
| Code review issues fixed  | 4 of 5                                              |
| Lines of production code  | ~280                                                |
| Error handling layers     | 6                                                   |
| API migrated from         | Anthropic → Google Gemini (`gemini-2.5-flash-lite`) |

### Key Production Patterns Learned

1. **Stream everything** — always prefer streaming for LLM responses
2. **Retry with backoff** — never retry instantly; always wait longer each time
3. **Count before you send** — know your token budget to avoid silent truncation
4. **Rate limit yourself** — prevent 429s before they happen
5. **Fail gracefully** — every error should surface actionable information, not stack traces
