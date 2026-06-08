#!/usr/bin/env python3
"""Token Tracker — logs every API call to a CSV for cost analysis.

Usage:
    python tracker.py \
        --model gemini-2.5-flash-lite \
        --prompt-tokens 2100 \
        --completion-tokens 320 \
        --cache-hit false \
        --cache-read-tokens 0 \
        --cache-create-tokens 0 \
        --query-hash a1b2c3d4e5
"""

import argparse
import csv
import os
import sys
from datetime import datetime, timezone

TELEMETRY_CSV = os.path.join(os.path.dirname(__file__), "telemetry.csv")
FIELDS = [
    "timestamp",
    "model",
    "prompt_tokens",
    "completion_tokens",
    "cost",
    "cache_hit",
    "cache_read_tokens",
    "cache_create_tokens",
    "query_hash",
]

PRICING = {
    "gemini-2.5-flash-lite": {
        "input_per_m": 0.10,
        "cached_input_per_m": 0.05,
        "output_per_m": 0.40,
    },
    "claude-sonnet-4-20250514": {
        "input_per_m": 3.00,
        "cached_input_per_m": 0.30,
        "output_per_m": 15.00,
    },
    "claude-3-5-sonnet-20241022": {
        "input_per_m": 3.00,
        "cached_input_per_m": 0.30,
        "output_per_m": 15.00,
    },
    "claude-3-haiku-20240307": {
        "input_per_m": 0.25,
        "cached_input_per_m": 0.025,
        "output_per_m": 1.25,
    },
    "gpt-4o-2024-08-06": {
        "input_per_m": 2.50,
        "cached_input_per_m": 1.25,
        "output_per_m": 10.00,
    },
}

DEFAULT_PRICING = {"input_per_m": 0.10, "cached_input_per_m": 0.05, "output_per_m": 0.40}


def calculate_cost(model, prompt_tokens, completion_tokens, cache_hit, cache_read_tokens):
    pricing = PRICING.get(model, DEFAULT_PRICING)
    cache_read = cache_read_tokens if cache_hit else 0
    fresh_tokens = prompt_tokens - cache_read

    input_cost = (
        fresh_tokens * (pricing["input_per_m"] / 1_000_000)
        + cache_read * (pricing["cached_input_per_m"] / 1_000_000)
    )
    output_cost = completion_tokens * (pricing["output_per_m"] / 1_000_000)
    return round(input_cost + output_cost, 8)


def log_call(model, prompt_tokens, completion_tokens, cache_hit, cache_read_tokens,
             cache_create_tokens, query_hash):
    cost = calculate_cost(
        model, prompt_tokens, completion_tokens,
        cache_hit.lower() == "true" if isinstance(cache_hit, str) else cache_hit,
        cache_read_tokens,
    )

    entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "model": model,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "cost": cost,
        "cache_hit": str(cache_hit).lower(),
        "cache_read_tokens": cache_read_tokens,
        "cache_create_tokens": cache_create_tokens,
        "query_hash": query_hash,
    }

    file_exists = os.path.isfile(TELEMETRY_CSV)
    with open(TELEMETRY_CSV, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDS)
        if not file_exists:
            writer.writeheader()
        writer.writerow(entry)

    print(f"Logged: {model} | {prompt_tokens} in / {completion_tokens} out | "
          f"cache={'hit' if entry['cache_hit'] == 'true' else 'miss'} | "
          f"cost=${cost}")


def main():
    parser = argparse.ArgumentParser(
        description="Log an API call to the telemetry CSV."
    )
    parser.add_argument("--model", required=True, help="Model identifier")
    parser.add_argument("--prompt-tokens", type=int, required=True)
    parser.add_argument("--completion-tokens", type=int, required=True)
    parser.add_argument("--cache-hit", choices=["true", "false"], default="false")
    parser.add_argument("--cache-read-tokens", type=int, default=0)
    parser.add_argument("--cache-create-tokens", type=int, default=0)
    parser.add_argument("--query-hash", default="")

    args = parser.parse_args()
    log_call(
        model=args.model,
        prompt_tokens=args.prompt_tokens,
        completion_tokens=args.completion_tokens,
        cache_hit=args.cache_hit == "true",
        cache_read_tokens=args.cache_read_tokens,
        cache_create_tokens=args.cache_create_tokens,
        query_hash=args.query_hash,
    )


if __name__ == "__main__":
    main()
