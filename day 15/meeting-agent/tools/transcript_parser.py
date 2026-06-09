import re
from typing import List, Dict


def parse_transcript(text: str) -> List[Dict[str, str]]:
    """Parse raw transcript text into structured speaker segments.

    Supports formats:
        Speaker: text
        [Speaker]: text
    Handles continuation lines (no speaker prefix → appended to previous).
    """
    segments: List[Dict[str, str]] = []
    lines = text.strip().split("\n")
    current_speaker = None
    current_text: List[str] = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        match = re.match(r"^\[?([\w\s]+)\]?\s*:\s*(.*)", line)
        if match:
            if current_speaker:
                segments.append({
                    "speaker": current_speaker.strip(),
                    "text": " ".join(current_text),
                })
            current_speaker = match.group(1).strip()
            current_text = [match.group(2).strip()]
        else:
            current_text.append(line)

    if current_speaker:
        segments.append({
            "speaker": current_speaker.strip(),
            "text": " ".join(current_text),
        })

    return segments
