#!/usr/bin/env python3
"""GroovyBot v2 — Production CLI with streaming, retry, token counting, rate limiting."""

import os
import sys
import time
import random

from google import genai
from google.genai import types
from google.api_core import exceptions as google_exceptions
from dotenv import load_dotenv

# ── Configuration ──────────────────────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are GroovyBot v2, a production-grade CLI chatbot. "
    "Be concise, friendly, and informative. "
    "Keep responses under 200 words unless asked for detail."
)

MODEL_NAME = "gemini-2.5-flash-lite"
MAX_TOKENS = 4096

RETRY_CONFIG = {
    "max_retries": 3,
    "base_delay": 1.0,
    "jitter": 0.5,
}

MAX_CONTEXT_TOKENS = 1_000_000
RESERVED_OUTPUT_TOKENS = 4096
MAX_INPUT_TOKENS = MAX_CONTEXT_TOKENS - RESERVED_OUTPUT_TOKENS

RATE_LIMIT = {
    "max_calls": 10,
    "window_sec": 60,
}


# ── Utilities ──────────────────────────────────────────────────────────────────

def sanitize_key(text: str) -> str:
    import re
    return re.sub(r"AIza[\w-]+", "AIza****...", text)


def make_contents(history: list[dict]) -> list[dict]:
    """Convert our role/content history to Gemini's contents format."""
    contents = []
    for msg in history:
        contents.append({
            "role": msg["role"],
            "parts": [{"text": msg["content"]}],
        })
    return contents


def truncate_history(history: list, new_content: str, client) -> list:
    """Remove oldest messages until total token count fits in context budget."""
    total = client.models.count_tokens(model=MODEL_NAME, contents=new_content).total_tokens
    for msg in reversed(history):
        total += client.models.count_tokens(model=MODEL_NAME, contents=msg["content"]).total_tokens

    while total > MAX_INPUT_TOKENS and history:
        popped = history.pop(0)
        total -= client.models.count_tokens(model=MODEL_NAME, contents=popped["content"]).total_tokens

    return history


# ── Rate Limiter ───────────────────────────────────────────────────────────────

class RateLimiter:
    """Simple sliding-window rate limiter to prevent 429s."""

    def __init__(self, max_calls: int, window_sec: float):
        self.max_calls = max_calls
        self.window_sec = window_sec
        self._timestamps: list[float] = []

    def wait_if_needed(self):
        now = time.time()
        cutoff = now - self.window_sec
        self._timestamps = [t for t in self._timestamps if t > cutoff]

        if len(self._timestamps) >= self.max_calls:
            sleep_time = self._timestamps[0] + self.window_sec - now
            if sleep_time > 0:
                self._say_wait(sleep_time)
                time.sleep(sleep_time)
            self._timestamps = [t for t in self._timestamps if t > time.time() - self.window_sec]

        self._timestamps.append(time.time())

    @staticmethod
    def _say_wait(seconds: float):
        print(
            f"\033[1;33m⏳ Rate limit approaching. "
            f"Waiting {seconds:.1f}s...\033[0m"
        )


# ── Retry Decorator ────────────────────────────────────────────────────────────

def retry_with_backoff(func, max_retries=3, base_delay=1.0, jitter=0.5):
    """Execute *func* with exponential backoff.

    Retry on rate limits and transient server errors.
    Delays: base_delay * (2^attempt) ± jitter.
    """
    for attempt in range(max_retries + 1):
        try:
            return func()
        except google_exceptions.ResourceExhausted:
            if attempt == max_retries:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, jitter)
            print(f"\033[1;33m⚠️  Rate limit. Retry {attempt+1}/{max_retries} in {delay:.1f}s\033[0m")
            time.sleep(delay)
        except google_exceptions.ServiceUnavailable as e:
            if attempt == max_retries:
                raise
            delay = base_delay * (2 ** attempt) + random.uniform(0, jitter)
            print(
                f"\033[1;33m⚠️  Server error: {sanitize_key(str(e))}. "
                f"Retry {attempt+1}/{max_retries} in {delay:.1f}s\033[0m"
            )
            time.sleep(delay)
        except google_exceptions.GoogleAPIError as e:
            msg = sanitize_key(str(e))
            code = getattr(e, 'code', None)
            if code and 500 <= code < 600 and attempt < max_retries:
                delay = base_delay * (2 ** attempt) + random.uniform(0, jitter)
                print(f"\033[1;33m⚠️  Server error ({code}). Retry in {delay:.1f}s\033[0m")
                time.sleep(delay)
                continue
            raise


# ── Streaming Response Handler ────────────────────────────────────────────────

def stream_and_print(response) -> str:
    """Iterate over a streaming response, printing tokens char-by-char.

    Returns the full assembled text.
    """
    chunks: list[str] = []
    try:
        for chunk in response:
            if chunk.text:
                chunks.append(chunk.text)
                print(chunk.text, end="", flush=True)
    except Exception as e:
        print(f"\n\033[1;31m⚠️  Stream interrupted: {sanitize_key(str(e))}\033[0m")
    print()
    return "".join(chunks)


# ── Chat Session ───────────────────────────────────────────────────────────────

def print_banner():
    print("\033[1;36m" + "╭" + "─" * 46 + "╮")
    print("│  🤖 GroovyBot v2 — Production CLI Chatbot  │")
    print("│  🔄 Streaming  ⏱ Retry  📊 Token counter  │")
    print("│  Type 'exit' or 'quit' to end              │")
    print("╰" + "─" * 46 + "╯" + "\033[0m")


def chat_loop(client, rate_limiter):
    history: list[dict] = []
    session_tokens = {"input": 0, "output": 0}

    while True:
        try:
            user_input = input("\n\033[1;33mYou:\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\033[1;31mGoodbye!\033[0m")
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit"):
            print("\033[1;31mGoodbye!\033[0m")
            break

        # Layer 1: Token counting & budget enforcement
        input_tokens = client.models.count_tokens(model=MODEL_NAME, contents=user_input).total_tokens
        total_history_tokens = sum(client.models.count_tokens(model=MODEL_NAME, contents=m["content"]).total_tokens for m in history)
        total_input = input_tokens + total_history_tokens

        if total_input > MAX_INPUT_TOKENS:
            print(
                f"\033[1;33m⚠️  Input ({total_input:,} tokens) exceeds budget "
                f"({MAX_INPUT_TOKENS:,}). Trimming history...\033[0m"
            )
            history = truncate_history(history, user_input, client)

        history.append({"role": "user", "content": user_input})

        print(f"\n\033[1;35m── GroovyBot ──────────────────────────────────\033[0m")

        # Layer 3-4: Rate limiter + retry
        def make_request():
            rate_limiter.wait_if_needed()
            return client.models.generate_content(
                model=MODEL_NAME,
                contents=make_contents(history),
                config=types.GenerateContentConfig(
                    max_output_tokens=MAX_TOKENS,
                ),
                stream=True,
            )

        try:
            stream = retry_with_backoff(
                make_request,
                max_retries=RETRY_CONFIG["max_retries"],
                base_delay=RETRY_CONFIG["base_delay"],
                jitter=RETRY_CONFIG["jitter"],
            )
        except google_exceptions.ResourceExhausted:
            print("\033[1;31m✖  Rate limit exhausted after retries. Try again later.\033[0m")
            history.pop()
            continue
        except google_exceptions.ServiceUnavailable:
            print("\033[1;31m✖  Network unreachable after retries. Check connection.\033[0m")
            history.pop()
            continue
        except google_exceptions.GoogleAPIError as e:
            print(f"\033[1;31m✖  API error: {sanitize_key(str(e))}\033[0m")
            history.pop()
            continue

        # Layer 5: Stream the response
        reply = stream_and_print(stream)

        if reply:
            history.append({"role": "model", "content": reply})

        # Update session stats
        output_tokens = client.models.count_tokens(model=MODEL_NAME, contents=reply).total_tokens
        session_tokens["input"] += input_tokens
        session_tokens["output"] += output_tokens

        # Token usage footer
        print(
            f"\033[2m📊  +{input_tokens:,} in  +{output_tokens:,} out  "
            f"│  Session: {session_tokens['input']:,} in  {session_tokens['output']:,} out\033[0m"
        )


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("Create a .env file or export it in your shell.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    rate_limiter = RateLimiter(
        max_calls=RATE_LIMIT["max_calls"],
        window_sec=RATE_LIMIT["window_sec"],
    )

    print_banner()
    chat_loop(client, rate_limiter)


if __name__ == "__main__":
    main()
