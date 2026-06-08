# Token Tracking Dashboard

Log every API call to a CSV and analyze your AI spend and token usage.

## Components

### `tracker.py` — Log a Call

```bash
python tracker.py \
    --model gemini-2.5-flash-lite \
    --prompt-tokens 2100 \
    --completion-tokens 320 \
    --cache-hit false \
    --cache-read-tokens 0 \
    --cache-create-tokens 0 \
    --query-hash a1b2c3d4e5
```

Appends a row to `telemetry.csv`. Calculates cost automatically based on model pricing.

### `telemetry.csv` — Data Store

Schema:

| Field                 | Description                           |
| :-------------------- | :------------------------------------ |
| `timestamp`           | ISO 8601 UTC                          |
| `model`               | Model identifier                      |
| `prompt_tokens`       | Input tokens sent                     |
| `completion_tokens`   | Output tokens generated               |
| `cost`                | Calculated USD                        |
| `cache_hit`           | Whether tokens were served from cache |
| `cache_read_tokens`   | Tokens read from cache                |
| `cache_create_tokens` | Tokens written to cache               |
| `query_hash`          | SHA256 prefix for dedup               |

### `analysis.py` — View Summary

```bash
python analysis.py
```

## Pricing Reference

| Model                      |  Input  |  Output  |
| :------------------------- | :-----: | :------: |
| gemini-2.5-flash-lite      | $0.10/M | $0.40/M  |
| claude-sonnet-4-20250514   | $3.00/M | $15.00/M |
| claude-3-5-sonnet-20241022 | $3.00/M | $15.00/M |
| claude-3-haiku-20240307    | $0.25/M | $1.25/M  |
| gpt-4o-2024-08-06          | $2.50/M | $10.00/M |
