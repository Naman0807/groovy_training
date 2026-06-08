from openai import OpenAI


class OpenAIProvider:
    MODEL = "gpt-4o-mini"

    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def send_message(self, messages: list, system_prompt: str = "", max_tokens: int = 1024) -> str:
        """Send messages using OpenAI API.

        messages format: [{"role": "user", "parts": ["text"]}, ...]
        """
        try:
            msgs = []
            if system_prompt:
                msgs.append({"role": "system", "content": system_prompt})
            for msg in messages:
                role = "assistant" if msg.get("role") in ("model", "assistant") else "user"
                content = msg.get("parts", [msg.get("content", "")])[0]
                if isinstance(content, str):
                    msgs.append({"role": role, "content": content})

            response = self.client.chat.completions.create(
                model=self.MODEL,
                messages=msgs,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"Error: OpenAI API error — {e}"

    @property
    def name(self) -> str:
        return "openai"
