import os
import sys

from google import genai
from google.genai import types
from dotenv import load_dotenv

from tools import ALL_TOOLS, execute_tool

SYSTEM_PROMPT = (
    "You are Groovy Agent, a helpful assistant with three tools:\n"
    "  1. Calculator tools — for arithmetic, math, and numerical questions.\n"
    "  2. Web search — for finding current information on the internet.\n"
    "  3. Slack notify — for sending messages to a Slack channel.\n\n"
    "When a user asks a question, decide which tool to use and call it. "
    "If you need more information, ask the user. "
    "When the task involves multiple steps, use tools sequentially."
)


def main() -> None:
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable is required.")
        print("Set it with: export GEMINI_API_KEY=<your-api-key>")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        tools=ALL_TOOLS,
    )

    print("=" * 54)
    print("  Groovy 3-Tool Agent — Gemini Function Calling")
    print("=" * 54)
    print("  Tools: calculator (6), web_search, slack_notify")
    print("  Type 'quit' to exit.\n")

    chat = client.chats.create(
        model="gemini-2.5-flash-lite",
        config=config,
    )

    while True:
        try:
            user_input = input("You: ")
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye!")
            break

        if user_input.lower() in ("quit", "exit", "q"):
            print("Goodbye!")
            break

        response = chat.send_message(user_input)

        while True:
            function_call_parts = []
            text_parts = []

            for part in response.candidates[0].content.parts:
                if part.function_call:
                    fc = part.function_call
                    name = fc.name
                    args = {k: v for k, v in fc.args.items()}
                    print(f"  \u2514\u2500 Tool: {name}({args})")
                    result = execute_tool(name, args)
                    print(f"     Result: {result.split(chr(10))[0]}...")
                    function_call_parts.append(
                        types.Part.from_function_response(
                            name=name,
                            response={"result": result},
                        )
                    )
                elif part.text:
                    text_parts.append(part.text)

            if function_call_parts:
                response = chat.send_message(function_call_parts)
            else:
                if text_parts:
                    print("Assistant:", " ".join(text_parts))
                break


if __name__ == "__main__":
    main()
