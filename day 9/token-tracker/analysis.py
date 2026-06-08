#!/usr/bin/env python3
"""Analysis Tool — reads telemetry.csv and prints summary statistics."""

import csv
import os
import sys
from datetime import datetime

TELEMETRY_CSV = os.path.join(os.path.dirname(__file__), "telemetry.csv")

PRICING = {
    "gemini-2.5-flash-lite": {
        "input_per_m": 0.10,
        "cached_input_per_m": 0.05,
        "output_per_m": 0.40,
    },
}


def load_csv(path):
    if not os.path.isfile(path):
        print(f"Error: telemetry file not found: {path}", file=sys.stderr)
        sys.exit(1)
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def get_pricing(model):
    return PRICING.get(model, {"input_per_m": 0.10, "cached_input_per_m": 0.05, "output_per_m": 0.40})


def simulate_nocache_cost(entry):
    p = get_pricing(entry["model"])
    pt = int(entry["prompt_tokens"])
    ct = int(entry["completion_tokens"])
    return pt * (p["input_per_m"] / 1_000_000) + ct * (p["output_per_m"] / 1_000_000)


def main():
    rows = load_csv(TELEMETRY_CSV)

    if not rows:
        print("No telemetry data found.")
        return

    timestamps = [r["timestamp"] for r in rows]
    total_calls = len(rows)
    unique_models = set(r["model"] for r in rows)

    total_prompt_tokens = sum(int(r["prompt_tokens"]) for r in rows)
    total_completion_tokens = sum(int(r["completion_tokens"]) for r in rows)
    total_cost = sum(float(r["cost"]) for r in rows)
    total_cost_nocache = sum(simulate_nocache_cost(r) for r in rows)

    cache_hits = sum(1 for r in rows if r["cache_hit"].lower() == "true")
    cache_read_total = sum(int(r["cache_read_tokens"]) for r in rows)
    cache_create_total = sum(int(r["cache_create_tokens"]) for r in rows)

    avg_prompt = total_prompt_tokens / total_calls if total_calls else 0
    avg_completion = total_completion_tokens / total_calls if total_calls else 0
    avg_total_tokens = (total_prompt_tokens + total_completion_tokens) / total_calls if total_calls else 0

    cache_savings_pct = (
        (1 - total_cost / total_cost_nocache) * 100 if total_cost_nocache > 0 else 0
    )

    print()
    print("╔══════════════════════════════════════════╗")
    print("║        Token Tracking Dashboard          ║")
    print("╚══════════════════════════════════════════╝")
    print()
    print(f"Date range:      {min(timestamps)[:10]} to {max(timestamps)[:10]}")
    print(f"Total calls:     {total_calls}")
    print(f"Models used:     {', '.join(sorted(unique_models))}")
    print()

    print("Cost Summary")
    print("━" * 40)
    print(f"Total cost:               ${total_cost:.4f}")
    print(f"Avg cost per call:        ${total_cost / total_calls:.4f}" if total_calls else "")
    print(f"Total w/out caching:      ${total_cost_nocache:.4f}")
    print(f"Cache savings:            {cache_savings_pct:.1f}%")
    print()

    print("Token Summary")
    print("━" * 40)
    print(f"Total prompt tokens:      {total_prompt_tokens:,}")
    print(f"Total completion tokens:  {total_completion_tokens:,}")
    print(f"Avg tokens per call:      {avg_total_tokens:,.0f}")
    print(f"Avg prompt tokens:        {avg_prompt:,.0f}")
    print(f"Avg completion tokens:    {avg_completion:,.0f}")
    print()

    print("Cache Performance")
    print("━" * 40)
    hit_rate = (cache_hits / total_calls * 100) if total_calls else 0
    print(f"Cache hits:               {cache_hits} / {total_calls} ({hit_rate:.0f}%)")
    print(f"Cache read tokens:        {cache_read_total:,}")
    print(f"Cache creation events:    {cache_create_total:,}")
    print()

    print("Per-Model Breakdown")
    print("━" * 40)
    for model in sorted(unique_models):
        model_rows = [r for r in rows if r["model"] == model]
        model_cost = sum(float(r["cost"]) for r in model_rows)
        model_calls = len(model_rows)
        model_hits = sum(1 for r in model_rows if r["cache_hit"].lower() == "true")
        print(f"  {model}")
        print(f"    Calls: {model_calls} | Hits: {model_hits} | Cost: ${model_cost:.4f}")
    print()


if __name__ == "__main__":
    main()
