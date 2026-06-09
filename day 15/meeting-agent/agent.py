#!/usr/bin/env python3
"""
Meeting Summarizer Agent

Takes a meeting transcript (text file), parses it into speaker segments,
calls Gemini via function calling to extract structured data, persists
the summary, and posts a formatted notification to Slack (mock).

Usage:
    python agent.py sample_transcript.txt
    python agent.py sample_transcript.txt --title "Sprint Retro — June 26"
"""

import argparse
import json
import os
import sys
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types

from tools.transcript_parser import parse_transcript
from tools.slack_poster import post_to_slack
from tools.calendar_lookup import find_followup_slots
from storage.db import save_summary

# Load .env file (if present)
load_dotenv()


def load_transcript(filepath: str) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


EXTRACTION_TOOL_DEF: Dict[str, Any] = {
    "name": "extract_meeting_summary",
    "description": "Extract structured summary from a meeting transcript",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "meeting_title": {
                "type": "STRING",
                "description": "Title or topic of the meeting",
            },
            "date": {
                "type": "STRING",
                "description": "Date of the meeting if mentioned",
            },
            "attendees": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "List of people who spoke or were addressed",
            },
            "key_decisions": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "Decisions made during the meeting",
            },
            "action_items": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "task": {"type": "STRING"},
                        "assignee": {"type": "STRING"},
                        "deadline": {
                            "type": "STRING",
                            "description": "Deadline if mentioned",
                        },
                    },
                    "required": ["task", "assignee"],
                },
                "description": "Action items with owner and deadline",
            },
            "risks_blockers": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
                "description": "Risks, blockers, or issues raised",
            },
            "follow_up_meetings": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "topic": {"type": "STRING"},
                        "suggested_date": {"type": "STRING"},
                    },
                },
                "description": "Follow-up meetings proposed",
            },
        },
        "required": ["key_decisions", "action_items"],
    },
}


def extract_with_llm(
    client: genai.Client,
    segments_text: str,
    meeting_title: Optional[str] = None,
) -> Dict[str, Any]:
    user_prompt = f"""Extract a structured summary from this meeting transcript.

{'Meeting title: ' + meeting_title if meeting_title else ''}

Transcript:
{segments_text}"""

    tool = types.Tool(function_declarations=[EXTRACTION_TOOL_DEF])
    config = types.GenerateContentConfig(
        tools=[tool],
        system_instruction="You are a precise meeting summarizer. Extract structured data from transcripts. Be thorough — include every action item mentioned.",
        tool_config=types.ToolConfig(
            function_calling_config=types.FunctionCallingConfig(
                mode="ANY",
                allowed_function_names=["extract_meeting_summary"],
            ),
        ),
    )

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=user_prompt,
        config=config,
    )

    # Check for function call in response
    if response.candidates:
        for part in response.candidates[0].content.parts:
            if part.function_call and part.function_call.name == "extract_meeting_summary":
                return dict(part.function_call.args)

    # Fallback: try to parse text as JSON
    if response.text:
        print("[LLM text output — falling back to JSON parse]")
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            print(response.text)

    raise RuntimeError("LLM did not return a structured summary")


def format_summary(summary: Dict) -> str:
    lines: List[str] = []
    lines.append(f"\U0001f4cb {summary.get('meeting_title', 'Meeting Summary')}")
    lines.append("=" * 50)

    attendees = summary.get("attendees", [])
    if attendees:
        lines.append(f"\U0001f465 Attendees: {', '.join(attendees)}")

    decisions = summary.get("key_decisions", [])
    if decisions:
        lines.append(f"\n\u2705 Key Decisions ({len(decisions)}):")
        for d in decisions:
            lines.append(f"   \u2022 {d}")

    actions = summary.get("action_items", [])
    if actions:
        lines.append(f"\n\U0001f4cc Action Items ({len(actions)}):")
        for a in actions:
            dl = f"  [due: {a['deadline']}]" if a.get("deadline") else ""
            lines.append(f"   \u2022 {a['task']}  \u2192  @{a['assignee']}{dl}")

    risks = summary.get("risks_blockers", [])
    if risks:
        lines.append(f"\n\u26a0\ufe0f  Risks / Blockers ({len(risks)}):")
        for r in risks:
            lines.append(f"   \u2022 {r}")

    followups = summary.get("follow_up_meetings", [])
    if followups:
        lines.append(f"\n\U0001f4c5 Follow-up Meetings ({len(followups)}):")
        for fup in followups:
            lines.append(f"   \u2022 {fup['topic']} \u2014 {fup.get('suggested_date', 'TBD')}")

    slots = summary.get("suggested_slots", [])
    if slots:
        lines.append(f"\n\U0001f550 Available Follow-up Slots:")
        for s in slots:
            lines.append(f"   \u2022 {s['date']} at {s['time']} ({s['duration_min']} min)")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Meeting Summarizer Agent")
    parser.add_argument("transcript", help="Path to transcript text file")
    parser.add_argument("--title", "-t", help="Meeting title (overrides LLM guess)")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("Tip: Create a .env file with: GEMINI_API_KEY=AIzaSy...")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    print(f"\U0001f4c4 Loading transcript: {args.transcript}")
    raw = load_transcript(args.transcript)
    print(f"   {len(raw)} characters read\n")

    print("\U0001f50d Parsing transcript into speaker segments...")
    segments = parse_transcript(raw)
    print(f"   Found {len(segments)} segments\n")

    segments_text = "\n".join(
        f"[{s['speaker']}]: {s['text']}" for s in segments
    )

    print("\U0001f9e0 Calling Gemini (function calling) for structured extraction...")
    summary = extract_with_llm(client, segments_text, meeting_title=args.title)
    print(f"   \u2705 Extracted {len(summary.get('key_decisions', []))} decisions")
    print(f"   \u2705 Extracted {len(summary.get('action_items', []))} action items")
    print(f"   \u2705 Extracted {len(summary.get('risks_blockers', []))} risks\n")

    print("\U0001f4c5 Checking calendar for follow-up slots...")
    summary["suggested_slots"] = find_followup_slots()
    print(f"   Found {len(summary['suggested_slots'])} available slots\n")

    print("\U0001f4be Saving to storage...")
    saved = save_summary(summary)
    print(f"   Saved as entry #{saved['id']} at {saved['created_at']}\n")

    print("\U0001f4e4 Posting to Slack...")
    post_to_slack(summary)

    print("\n" + format_summary(summary))
    print("\n\u2705 Agent run complete.")


if __name__ == "__main__":
    main()
