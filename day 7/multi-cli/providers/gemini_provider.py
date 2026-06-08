from google import genai
from google.genai import types


class GeminiProvider:
    MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def send_message(self, messages: list, system_prompt: str = "", max_tokens: int = 1024) -> str:
        """Send messages using the new google.genai SDK."""
        try:
            contents = []
            if system_prompt:
                contents.append(
                    types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)])
                )
                contents.append(
                    types.Content(role="model", parts=[types.Part.from_text(text="Understood.")])
                )
            for msg in messages:
                role = "model" if msg.get("role") == "assistant" else msg.get("role", "user")
                parts_text = msg.get("parts", [msg.get("content", "")])
                for p in parts_text:
                    text = p if isinstance(p, str) else str(p)
                    contents.append(
                        types.Content(role=role, parts=[types.Part.from_text(text=text)])
                    )

            response = self.client.models.generate_content(
                model=self.MODEL,
                contents=contents,
            )
            return response.text
        except Exception as e:
            return f"Error: Gemini API error — {e}"

    @property
    def name(self) -> str:
        return "gemini"
