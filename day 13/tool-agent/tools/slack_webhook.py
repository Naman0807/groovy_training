import json

SLACK_WEBHOOK_TOOL = {
    "name": "slack_notify",
    "description": "Send a notification message to a Slack channel via webhook. (Simulated — replace with real requests.post() in production.)",
    "input_schema": {
        "type": "object",
        "properties": {
            "channel": {
                "type": "string",
                "description": "Slack channel to post to (e.g. '#general', '#random', '#day-13')",
            },
            "message": {
                "type": "string",
                "description": "The message text to send",
            },
        },
        "required": ["channel", "message"],
    },
}


def execute_slack_webhook(_name: str, args: dict) -> str:
    channel: str = args["channel"]
    message: str = args["message"]

    simulated_payload = {
        "channel": channel,
        "text": message,
        "username": "Groovy Bot",
        "icon_emoji": ":robot_face:",
    }

    return (
        f"[Slack Webhook — Simulated]\n"
        f"  Channel: {channel}\n"
        f"  Message: {message}\n"
        f"  Status: delivered ✓\n"
        f"  Payload: {json.dumps(simulated_payload, indent=4)}"
    )
