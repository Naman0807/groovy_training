from typing import Dict, List
from datetime import datetime, timedelta


def _generate_mock_calendar(days_ahead: int = 5) -> List[Dict]:
    """Generate mock calendar availability starting from tomorrow."""
    base = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
    slots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
    calendar = []
    for i in range(1, days_ahead + 1):
        day = base + timedelta(days=i)
        calendar.append({
            "date": day.strftime("%Y-%m-%d"),
            "slots": slots,
        })
    return calendar


def find_followup_slots(num_slots: int = 3) -> List[Dict]:
    """Find available 30-min calendar slots for follow-up meetings.

    Returns the next N available slots from a mock calendar.
    """
    calendar = _generate_mock_calendar()
    available: List[Dict] = []

    for day in calendar:
        for slot in day["slots"]:
            available.append({
                "date": day["date"],
                "time": slot,
                "duration_min": 30,
            })
            if len(available) >= num_slots:
                return available

    return available
