import json
import os
from typing import Any, Dict, List, Optional
from datetime import datetime

STORAGE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "summaries.json")


def _ensure_storage() -> None:
    if not os.path.exists(STORAGE_PATH):
        with open(STORAGE_PATH, "w") as f:
            json.dump([], f)


def save_summary(summary: Dict) -> Dict[str, Any]:
    """Persist a meeting summary to the JSON store.

    Auto-assigns an incrementing ID and a created_at timestamp.
    Returns the saved record with metadata.
    """
    _ensure_storage()
    with open(STORAGE_PATH, "r") as f:
        data: List[Dict] = json.load(f)

    record = {
        "id": len(data) + 1,
        "created_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
        **summary,
    }
    data.append(record)

    with open(STORAGE_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return record


def get_summaries(limit: int = 10) -> List[Dict]:
    """Retrieve the most recent N summaries."""
    _ensure_storage()
    with open(STORAGE_PATH, "r") as f:
        data: List[Dict] = json.load(f)
    return data[-limit:]
