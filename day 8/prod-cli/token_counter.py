#!/usr/bin/env python3
"""Token Counter — Estimate token counts using Gemini API or character heuristic.

Used by cli.py to enforce token budgets and display usage stats.

Uses the Gemini API's built-in count_tokens when possible for accurate counts,
falls back to a character-based heuristic (~4 chars per token).

Usage:
    python token_counter.py "Your text here"
    python token_counter.py --file path/to/file.txt
"""

import argparse
import os
import sys

from dotenv import load_dotenv

load_dotenv()

try:
    from google import genai
    from google.genai import types

    _api_key = os.environ.get("GEMINI_API_KEY")
    if _api_key:
        _client = genai.Client(api_key=_api_key)

        def count_tokens(text: str) -> int:
            if not text:
                return 0
            return _client.models.count_tokens(model="gemini-2.5-flash-lite", contents=text).total_tokens

        _using_gemini = True
    else:
        raise RuntimeError("GEMINI_API_KEY not set")
except Exception:
    def count_tokens(text: str) -> int:
        if not text:
            return 0
        return max(1, len(text) // 4)

    _using_gemini = False


# ── Utility Functions ─────────────────────────────────────────────────────────

def describe_usage():
    if _using_gemini:
        return "Gemini API count_tokens — accurate"
    return "character heuristic (≈4 chars/token) — approximate"


def format_tokens(count: int) -> str:
    return f"{count:,}"


# ── CLI Mode ──────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Count tokens in text for Gemini API calls."
    )
    parser.add_argument(
        "text",
        nargs="?",
        help="Text to count tokens for (omit to read from stdin)",
    )
    parser.add_argument(
        "--file",
        "-f",
        help="Read text from a file instead of argument",
    )
    parser.add_argument(
        "--backend",
        action="store_true",
        help="Show which token-counting backend is active",
    )

    args = parser.parse_args()

    if args.backend:
        print(describe_usage())
        return

    if args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            text = f.read()
    elif args.text:
        text = args.text
    else:
        text = sys.stdin.read()

    count = count_tokens(text)
    print(f"{format_tokens(count)} tokens")
    print(f"~{len(text)} characters", file=sys.stderr)


if __name__ == "__main__":
    main()
