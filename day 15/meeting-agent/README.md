# Meeting Summarizer Agent

An AI agent that transforms raw meeting transcripts into structured action items, decisions, risks, and follow-up tasks — then persists them and notifies Slack.

Built as **Mini-Project 3** of the Groovy Web 30-Day AI-First Engineer training.

## Problem

After every team meeting at Groovy Web, action items disappear into:
- Verbal handoffs ("I'll DM you that")
- WhatsApp forwards
- Forgotten Slack threads

When 5 team members were asked "What were your action items from yesterday's standup?" — **only 2 could recall all of them.**

## Solution

One command turns a transcript into a permanent, structured record:

```bash
python agent.py sample_transcript.txt --title "Sprint Retro — June 26"
```

### What it outputs

- ✅ **Key decisions** — what was decided
- 📌 **Action items** — task + assignee + deadline
- ⚠️ **Risks / blockers** — issues raised
- 📅 **Follow-up meetings** — proposed topics + dates
- 🕐 **Calendar slots** — available times for follow-ups
- 📤 **Slack post** — formatted message (mock)
- 💾 **Persistent storage** — all summaries saved to `storage/summaries.json`

## Architecture

```
sample_transcript.txt
        │
        ▼
┌──────────────────┐
│    agent.py       │  ← orchestrator (Gemini SDK)
└────────┬─────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
    ▼         ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Parser  │ │ Gemini  │ │ Slack  │ │Calendar│
│ Tool    │ │ function│ │ Poster │ │ Lookup │
│         │ │ calling │ │ (mock) │ │ (mock) │
└────────┘ └────────┘ └────────┘ └────────┘
    │                             │
    ▼                             ▼
┌──────────┐               ┌──────────────┐
│ storage/ │               │  Suggested   │
│summaries │               │  follow-up   │
│ .json    │               │  slots       │
└──────────┘               └──────────────┘
```

### Components

| Component | File | Role |
|-----------|------|------|
| **Agent** | `agent.py` | Reads transcript, calls Gemini with function declarations, routes output |
| **Parser** | `tools/transcript_parser.py` | Splits raw text into `[{speaker, text}]` segments |
| **LLM** | Gemini 2.5 Flash | Extracts structured data via function calling |
| **Slack** | `tools/slack_poster.py` | Formats + posts to Slack (mock; swap `print()` for `requests.post()` in prod) |
| **Calendar** | `tools/calendar_lookup.py` | Returns available follow-up slots from mock data |
| **Storage** | `storage/db.py` | JSON file-based `save`/`list` — mimics a document DB |

## Setup

### Prerequisites

- Python 3.10+
- A [Gemini API key](https://aistudio.google.com/apikey)

### Install

```bash
cd meeting-agent
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### Configure

```bash
export GEMINI_API_KEY="AIzaSy..."
```

Or create a `.env` file:

```
GEMINI_API_KEY=AIzaSy...
```

## Usage

### Basic

```bash
python agent.py sample_transcript.txt
```

### With meeting title

```bash
python agent.py sample_transcript.txt --title "Daily Standup — June 26"
```

### Output example

```
📋 Sprint Retro — Week 12
==================================================
👥 Attendees: Naman, Krunal, Rahul, Nauman, Dhruti

✅ Key Decisions (3):
   • Adopt Gemini function calling for all future agent projects
   • Switch dashboard charting from Recharts to Vega-Lite permanently
   • Run DB migration on staging first, then prod on Sunday

📌 Action Items (4):
   • Extend test token expiry to 1 hour  →  @Naman  [due: 2026-06-26]
   • Fix Slack deploy notifications       →  @Naman  [due: 2026-06-26]
   • Review rollback plan                 →  @Dhruti  [due: 2026-06-26]
   • Send API endpoints for optimization  →  @Rahul  [due: 2026-06-27]

⚠️  Risks / Blockers (2):
   • Auth test tokens expiring mid-suite
   • QA sign-off needed before prod migration

📅 Follow-up Meetings (1):
   • Sprint progress check — 2026-06-28

🕐 Available Follow-up Slots:
   • 2026-06-29 at 10:00 (30 min)
   • 2026-06-29 at 11:00 (30 min)
```

## Testing

```bash
# Run the agent with the sample transcript
python agent.py sample_transcript.txt

# Check persisted summaries
python -c "from storage.db import get_summaries; import json; print(json.dumps(get_summaries(), indent=2))"
```

## Roadmap

- [ ] **Real Slack webhook** — replace mock with `requests.post` to a real Slack app
- [ ] **Real database** — swap JSON file for Postgres or MongoDB
- [ ] **Multilingual support** — verify Gujarati/Hinglish transcripts
- [ ] **Speaker diarization** — infer speakers when transcript has no labels
- [ ] **CLI pipe mode** — `cat transcript.txt | python agent.py`

## Project Structure

```
meeting-agent/
├── agent.py                  # Main agent orchestrator
├── sample_transcript.txt     # Mock meeting transcript
├── requirements.txt          # Python dependencies
├── README.md                 # This file
├── demo_script.md            # 10-min demo walkthrough
├── tools/
│   ├── __init__.py
│   ├── transcript_parser.py  # Tool 1: parse transcript to segments
│   ├── slack_poster.py       # Tool 2: post to Slack (mock)
│   └── calendar_lookup.py    # Tool 3: find calendar slots (mock)
└── storage/
    ├── __init__.py
    ├── db.py                 # File-based storage
    └── summaries.json        # Persisted summaries
