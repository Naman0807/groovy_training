# Day 15 — Mini-Project 3 · Custom Agent · Real Use Case

**Trainee:** Naman  
**Date:** Friday, June 26, 2026  
**Theme:** Build a real agent that solves an actual ops pain  
**Deliverable:** Meeting Summarizer Agent + leadership demo

---

## Table of Contents

1. [Problem Selection](#1-problem-selection)
2. [Architecture](#2-architecture)
3. [Build Notes](#3-build-notes)
4. [Leadership Demo](#4-leadership-demo)
5. [GitHub Push](#5-github-push)

---

## 1. Problem Selection

After reviewing the options (standup bot, code review bot, candidate screener, meeting summarizer), I chose **Meeting Summarizer Agent**.

**Why:**
- Every team at Groovy Web has 4–6 meetings/day — most produce no written record
- Action items get lost in Slack threads, verbal promises, or WhatsApp forwards
- Krunal specifically mentioned in standup: *"We need a way to turn our daily standup + sprint retro transcripts into trackable action items"*
- Nauman confirmed the LLM approach is feasible: *"Gemini can handle 15-min transcript chunks easily with function calling"*

**Pain point confirmed:** After standup, I asked 5 team members "What were your action items from yesterday?" — only 2 could recall all of them.

---

## 2. Architecture

```
sample_transcript.txt
        |
        v
┌─────────────────┐
│    agent.py      │  ← orchestrator: reads transcript, calls LLM, saves, posts
│  (gemini)        │
└────────┬────────┘
         |
    ┌────┴────┬──────────┬──────────┐
    v         v          v          v
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Parser  │ │  LLM   │ │ Slack  │ │Calendar│
│Tool    │ │(Gemini)│ │Poster  │ │Lookup  │
│.py     │ │func    │ │(mock)  │ │(mock)  │
│        │ │calling │ │        │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
                      │
                      v
                 ┌──────────┐
                 │  storage/ │
                 │summaries  │
                 │ .json     │
                 └──────────┘
```

### Components

| Component | Tech | Role |
| :-------- | :--- | :--- |
| **agent.py** | Python + `google-generativeai` SDK | Reads transcript, calls Gemini with function declarations, routes output |
| **transcript_parser.py** | regex + Python | Splits raw text into `[{speaker, text}]` segments |
| **slack_poster.py** | mock HTTP | Prints formatted Slack blocks to stdout (mocks `requests.post`) |
| **calendar_lookup.py** | mock data | Returns available 30-min follow-up slots from a fake calendar |
| **storage/db.py** | JSON file | `save_summary()` / `get_summaries()` — mimics a document DB |
| **LLM** | Gemini 2.5 Flash (`function calling`) | Extracts decisions, action items, risks, follow-ups |

### Data Flow

1. Raw transcript → `parse_transcript()` → structured segments
2. Segments → Gemini with `extract_meeting_summary` function declaration → structured JSON
3. Structured summary → `save_summary()` → `summaries.json`
4. Structured summary → `post_to_slack()` → formatted Slack message
5. Follow-up needs → `find_followup_slots()` → suggested calendar slots

---

## 3. Build Notes

### Tool Choice

| Decision | Choice | Why |
| :------- | :----- | :-- |
| **LLM** | Gemini 2.5 Flash (Google) | Best at function calling; free tier available |
| **Tool calling** | `google-generativeai` SDK `tools=` param with `FunctionDeclaration` | Returns structured JSON via `function_call` — no parsing fragility |
| **Tool forcing** | `tool_config={'function_calling_config': {'allowed_function_names': [...}}}` | Forces Gemini to always return a `functionCall` response instead of text |
| **Storage** | JSON file (not real DB) | Day 15 scope: prove the flow; swap to Postgres/MongoDB in prod |
| **Slack** | Mock (prints to stdout) | Real webhook is 1 `requests.post` away — Krunal will provision a real Slack app next sprint |

### Prompt Design

The system prompt is minimal — Gemini's function calling handles the structure:

```text
You are a precise meeting summarizer. Extract structured data from transcripts.
```

The function declaration enforces:
- `meeting_title` (string)
- `attendees` (string array)
- `key_decisions` (string array)
- `action_items` (array of `{task, assignee, deadline}`)
- `risks_blockers` (string array)
- `follow_up_meetings` (array of `{topic, suggested_date}`)

### Issues Encountered

| Problem | Resolution |
| :------ | :--------- |
| Gemini returned text instead of functionCall on first call | Added `tool_config={'function_calling_config': {'allowed_function_names': ['extract_meeting_summary']}}` to force function calling |
| `summaries.json` didn't exist on first run | `db.py` now calls `_ensure_storage()` which creates an empty `[]` file |
| Speaker names with spaces (e.g. "Krunal Patel") broke regex | Updated parser regex to `r'^\[?([\w\s]+)\]?\s*:\s*(.*)'` |
| Action items without deadlines caused KeyError | Made `deadline` optional in both schema and display logic |

### Storage Schema (`summaries.json`)

```json
[
  {
    "id": 1,
    "meeting_title": "Sprint Retro — Week 12",
    "date": "2026-06-25",
    "attendees": ["Naman", "Krunal", "Rahul", "Nauman", "Dhruti"],
    "key_decisions": ["Adopt Gemini function calling for all future agent projects"],
    "action_items": [
      {"task": "Write integration tests for parser", "assignee": "Naman", "deadline": "2026-06-28"}
    ],
    "risks_blockers": ["Dhruti's leave next week may delay QA pass"],
    "follow_up_meetings": [{"topic": "Parser edge cases", "suggested_date": "2026-06-29"}],
    "suggested_slots": [{"date": "2026-06-29", "time": "10:00", "duration_min": 30}],
    "created_at": "2026-06-26T15:30:00"
  }
]
```

---


## 4. GitHub Push

```bash
git add "days/day 15/"
git commit -m "day 15: meeting summarizer agent — mini-project 3"
git push origin main
```

### Repository Structure

```
days/day 15/
├── day15.md
└── meeting-agent/
    ├── agent.py
    ├── sample_transcript.txt
    ├── requirements.txt
    ├── README.md
    ├── demo_script.md
    ├── tools/
    │   ├── __init__.py
    │   ├── transcript_parser.py
    │   ├── slack_poster.py
    │   └── calendar_lookup.py
    └── storage/
        ├── __init__.py
        ├── db.py
        └── summaries.json
```

---

## Daily Reflection

> [!TIP]
> **Biggest takeaway:** Tool-calling LLMs make agent building feel like wiring LEGO blocks. The hardest part wasn't the code — it was defining the *function schema* precisely enough that Gemini always returns parseable JSON. Schema design is the new API design.

### Stats

| Metric | Value |
| :----- | :---- |
| Agent runtime (with LLM call) | ~8 seconds |
| Lines of agent code | ~180 |
| Number of tools | 3 |
| Tool calls per run | 1 LLM + 2 local tools |
| Leadership demos | 1 |
| "Would actually use" votes | 1 (Krunal) |
| Action items generated from demo | 4 |

---
