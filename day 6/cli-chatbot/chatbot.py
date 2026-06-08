#!/usr/bin/env python3
"""GroovyBot — multi-turn CLI chatbot using the Google Gemini Python SDK."""

import os
import sys
from dotenv import load_dotenv
load_dotenv()
from google import genai
from google.genai import types

SYSTEM_PROMPT = "You are GroovyBot, a helpful CLI chatbot built during Day 6 of Groovy Web training. Be concise, friendly, and informative."


def main():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("Create a .env file or set it in your shell.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    chat = client.chats.create(
        model="gemini-2.5-flash",
        config={"system_instruction": SYSTEM_PROMPT},
    )

    sys.stdout.reconfigure(encoding='utf-8')
    print("\033[1;36m" + "╭" + "─" * 46 + "╮")
    print("│  🤖 GroovyBot — Gemini CLI Chatbot          │")
    print("│  Type 'exit' or 'quit' to end               │")
    print("╰" + "─" * 46 + "╯" + "\033[0m")

    while True:
        try:
            user_input = input("\n\033[1;33mYou:\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit"):
            print("\033[1;31mGoodbye!\033[0m")
            break

        try:
            response = chat.send_message(user_input)
            reply = response.text
        except Exception as e:
            reply = f"Error: {e}"

        print(f"\n\033[1;35m── GroovyBot ──────────────────────────────────\033[0m")
        print(reply)


if __name__ == "__main__":
    main()
