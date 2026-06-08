#!/usr/bin/env python3
"""Codebase Explainer — sends code context (≤10K tokens) to Gemini and returns an explanation."""

import argparse
import csv
import hashlib
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from google import genai
from google.genai import types
from dotenv import load_dotenv


TELEMETRY_CSV = os.path.join(os.path.dirname(__file__), "..", "token-tracker", "telemetry.csv")

ALLOWED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx", ".json", ".yaml", ".yml", ".md", ".html", ".css", ".sql", ".rs", ".go", ".java", ".rb"}

MAX_FILE_SIZE = 5 * 1024
MAX_TOKENS = 10_000
MODEL = "gemini-2.5-flash-lite"
OUTPUT_TOKENS = 1024

SYSTEM_PROMPT = """You are a senior software engineer explaining codebases to developers.
Given a project directory and a specific question, analyze the provided files and produce a clear, 
concise explanation. Focus on the architecture, data flow, and key design decisions relevant to 
the question. If you don't find enough context to answer fully, say so — don't invent details.
Use markdown formatting with bullet points. Be specific: mention file paths, function names, 
and line numbers where relevant."""


_client = None

def count_tokens(text: str) -> int:
    """Count tokens using the Gemini API."""
    global _client
    if _client is None:
        _client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
    if not text:
        return 0
    return _client.models.count_tokens(model=MODEL, contents=text).total_tokens


def get_relevant_files(root: str) -> list[Path]:
    root_path = Path(root)
    files = []
    for p in root_path.rglob("*"):
        if p.is_file() and p.suffix in ALLOWED_EXTENSIONS:
            try:
                if p.stat().st_size <= MAX_FILE_SIZE:
                    files.append(p)
            except OSError:
                continue
    return sorted(files)


def read_file_head_tail(path: Path, head_chars: int = 2000, tail_chars: int = 500) -> str:
    try:
        content = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return f"# {path.name}\n(unreadable file)\n"
    if len(content) <= head_chars + tail_chars:
        return f"# {path.name}\n{content}\n"
    head = content[:head_chars]
    tail = content[-tail_chars:]
    return f"# {path.name}\n{head}\n\n... (truncated) ...\n\n{tail}\n"


def build_context(directory: str, question: str) -> tuple[str, list[Path]]:
    files = get_relevant_files(directory)
    context_parts = []
    included_files = []
    budget = MAX_TOKENS - count_tokens(question) - 200
    for f in files:
        excerpt = read_file_head_tail(f)
        tokens = count_tokens(excerpt) + 10
        if budget - tokens < 0:
            break
        context_parts.append(excerpt)
        budget -= tokens
        included_files.append(f)
    full = "\n---\n".join(context_parts)
    return full, included_files


def append_telemetry(entry: dict):
    os.makedirs(os.path.dirname(TELEMETRY_CSV), exist_ok=True)
    file_exists = os.path.isfile(TELEMETRY_CSV)
    with open(TELEMETRY_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(entry.keys()))
        if not file_exists:
            writer.writeheader()
        writer.writerow(entry)


def main():
    parser = argparse.ArgumentParser(description="Explain a codebase using Gemini.")
    parser.add_argument("directory", help="Path to the project directory")
    parser.add_argument("question", help="What you want to know about the codebase")
    args = parser.parse_args()

    directory = os.path.abspath(args.directory)
    if not os.path.isdir(directory):
        print(f"Error: directory not found: {directory}", file=sys.stderr)
        sys.exit(1)

    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable required.", file=sys.stderr)
        sys.exit(1)

    print("─" * 55)
    print("  Codebase Explainer")
    print(f"  Project: {directory}")
    print(f"  Question: {args.question}")
    print("─" * 55)
    print()

    context, included = build_context(directory, args.question)
    actual_tokens = count_tokens(context)

    query_hash = hashlib.sha256(
        (MODEL + SYSTEM_PROMPT + args.question).encode()
    ).hexdigest()[:12]

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=MODEL,
        contents=f"Project files:\n\n{context}\n\nQuestion: {args.question}",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
        ),
    )

    usage = response.usage_metadata
    prompt_tokens = usage.prompt_token_count
    completion_tokens = usage.candidates_token_count

    input_cost = prompt_tokens * (0.10 / 1_000_000)
    output_cost = completion_tokens * (0.40 / 1_000_000)
    total_cost = input_cost + output_cost

    entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "model": MODEL,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cost": round(total_cost, 6),
        "cache_hit": "false",
        "cache_read_tokens": 0,
        "cache_create_tokens": 0,
        "query_hash": query_hash,
    }
    append_telemetry(entry)

    explanation = response.text
    print(explanation)
    print()
    print("─" * 55)
    print(f"Files analyzed: {len(included)} ({actual_tokens} tokens)")
    print(f"Model: {MODEL} | Cost: ${total_cost:.6f}")
    print("─" * 55)


if __name__ == "__main__":
    main()
