from anthropic import Anthropic


class ClaudeProvider:
    MODEL = "claude-sonnet-4-20250514"

    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    def send_message(self, messages: list, system_prompt: str = "", max_tokens: int = 1024) -> str:
        """Send messages using Anthropic Claude API.

        messages format: [{"role": "user", "parts": ["text"]}, ...]
        """
        try:
            msgs = []
            for msg in messages:
                role = "assistant" if msg.get("role") in ("model", "assistant") else "user"
                content = msg.get("parts", [msg.get("content", "")])[0]
                if isinstance(content, str):
                    msgs.append({"role": role, "content": content})

            response = self.client.messages.create(
                model=self.MODEL,
                system=system_prompt if system_prompt else None,
                messages=msgs,
                max_tokens=max_tokens,
            )
            return response.content[0].text if response.content else ""
        except Exception as e:
            return f"Error: Claude API error — {e}"

    @property
    def name(self) -> str:
        return "claude"
