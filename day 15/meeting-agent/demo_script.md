# Demo Script — Meeting Summarizer Agent (10 min)

**Audience:** Krunal, Rahul, Nauman  
**Room:** Narmada  
**Date:** 2026-06-26

---

## Setup (before they arrive)

```bash
# Terminal 1 — agent is ready
cd ~/groovy/days/day\ 15/meeting-agent
source venv/bin/activate

# Verify API key
echo $GEMINI_API_KEY  # should not be empty

# Open 3 windows:
#   Left:   VS Code with agent.py
#   Top-R:  terminal
#   Bot-R:  storage/summaries.json
```

---

## Walkthrough

### 0:00–0:30 — Hook

> *"How many of you had a meeting yesterday where you walked out and someone said 'I'll send you the action items' — but they never came?"*

Wait for nods. That's everyone.

### 0:30–2:00 — Show the pain

Open `sample_transcript.txt` and scroll.

> *"This is a 4-minute standup. 20 lines. It has:"
> * "4 action items with owners"
> * "2 blockers"
> * "3 decisions"
> * "1 follow-up meeting"
>
> *"Without this agent, that information lives in Krunal's head and nowhere else. New joiners lose context. Remote folks miss it entirely."*

### 2:00–4:00 — Run the agent

```bash
python agent.py sample_transcript.txt --title "Sprint Retro — June 26"
```

Watch it scroll. Point out each phase as it happens:

1. **"Parsing transcript"** — show `transcript_parser.py` in VS Code
2. **"Calling Gemini (function calling)"** — this is where the LLM extracts structure
3. **"Checking calendar"** — `calendar_lookup.py` finds real-ish slots
4. **"Saving to storage"** — the JSON file gets written
5. **"Posting to Slack"** — the mock Slack blocks print

### 4:00–6:00 — Walk through the output

Scroll back to the top of the output and explain each section:

- **✅ Key Decisions** — "These are the _why_ — the rationale that gets lost in chat threads."
- **📌 Action Items** — "Task + assignee + deadline. This is the core value. Every item is trackable."
- **⚠️ Risks / Blockers** — "Surface issues before they become emergencies."
- **📅 Follow-up Meetings** — "Proactive scheduling — no more 'let's circle back' with no date."

### 6:00–7:00 — Show persistence

Open `storage/summaries.json` in VS Code.

> *"Every summary is saved with an ID and timestamp. You can query past meetings, build a dashboard, or feed this into a sprint retro tool."*

```bash
python -c "from storage.db import get_summaries; import json; print(json.dumps(get_summaries(), indent=2))"
```

### 7:00–8:30 — Run a second transcript

```bash
python agent.py sample_transcript.txt --title "Daily Standup — June 27"
```

Show that `summaries.json` now has 2 entries — the storage layer handles append-only writes.

### 8:30–9:30 — Look under the hood

Open `agent.py` and scroll to:

1. **`EXTRACTION_TOOL` dict** — "This JSON schema is the contract between our code and the LLM. Get this right, and the output is always parseable."
2. **`extract_with_llm()`** — "Note the `function_calling` config — this forces Gemini to return a structured function call instead of free-text."
3. **`format_summary()`** — "Human-readable output, generated from the same structured data that goes to Slack."

### 9:30–10:00 — Q&A

Anticipated questions and crisp answers:

**Krunal:** *"Can we plug this into our actual standup channel?"*
> Yes. The Slack poster has a `MOCK_WEBHOOK_URL` constant. In production, that becomes a real Slack webhook URL. Two lines of code change. If you create a Slack app with the `chat:write` scope, I can wire it in under an hour.

**Rahul:** *"Does it handle Gujarati?"*
> Gemini processes multilingual input natively. I haven't tested it with a Gujarati-heavy transcript yet — that's my action item from this demo. If it struggles, a one-line system prompt tweak (`lang: gu`) should fix it.

**Nauman:** *"What about transcripts without speaker labels?"*
> That's v1. I'd add a `--diarize` flag that concatenates all text without speaker labels and asks Gemini to infer who said what from context. Gemini 2.5 Flash is surprisingly good at this.

---

## Closing

> *"This is 180 lines of Python and one API call. It replaces a habit that loses 60% of meeting value every single day. I'd like to ship it to our standup channel by Monday."*

**Ask for the green light.** If Krunal says yes, the next steps are:
1. Provision a Slack app + webhook URL
2. Replace the `print()` in `slack_poster.py` with `requests.post()`
3. Deploy as a cron job or GitHub Action after every standup

---

## Fallback Plan

| Issue | Workaround |
|-------|------------|
| API key not set | `export GEMINI_API_KEY="AIzaSy..."` from a pre-written `.env` file |
| No internet | Agent fails gracefully — show the code architecture instead of a live run |
| Gemini rate-limited | Run with cached output stored in `storage/summaries.json` (entry #1 exists) |
| Screen sharing broken | Share terminal output via a pre-recorded asciinema cast |
