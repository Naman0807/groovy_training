#!/usr/bin/env python3
"""GroovyBot — Multi-provider CLI chatbot (Gemini, OpenAI, Claude)."""

import argparse
import os
import sys

from dotenv import load_dotenv
load_dotenv()

from providers.openai_provider import OpenAIProvider
from providers.claude_provider import ClaudeProvider
from providers.gemini_provider import GeminiProvider

SYSTEM_PROMPT = "You are GroovyBot, a helpful CLI chatbot. Be concise, friendly, and informative."

PROVIDER_CONFIG = {
    "openai": {
        "class": OpenAIProvider,
        "env_key": "OPENAI_API_KEY",
        "color": "\033[1;32m",
        "label": "OpenAI GPT-4o Mini",
    },
    "claude": {
        "class": ClaudeProvider,
        "env_key": "ANTHROPIC_API_KEY",
        "color": "\033[1;35m",
        "label": "Claude Sonnet 4",
    },
    "gemini": {
        "class": GeminiProvider,
        "env_key": "GEMINI_API_KEY",
        "color": "\033[1;34m",
        "label": "Gemini 2.5 Flash",
    },
}

RESET = "\033[0m"
PROVIDER_NAMES = ", ".join(PROVIDER_CONFIG.keys())


def main():
    parser = argparse.ArgumentParser(
        description="GroovyBot — Multi-provider CLI Chatbot"
    )
    parser.add_argument(
        "--provider", "-p",
        choices=list(PROVIDER_CONFIG.keys()),
        default="openai",
        help=f"AI provider to use (default: openai). Options: {PROVIDER_NAMES}",
    )
    args = parser.parse_args()

    config = PROVIDER_CONFIG[args.provider]
    COLOR = config["color"]
    label = config["label"]

    api_key = os.environ.get(config["env_key"])
    if not api_key:
        print(f"Error: {config['env_key']} not set in environment or .env file.")
        print(f"Get a key and add it to your .env file as:\n{config['env_key']}=your_key_here")
        sys.exit(1)

    provider = config["class"](api_key)

    print(COLOR + "╭" + "─" * 46 + "╮")
    print(f"│  🤖 GroovyBot — {label:<30} │")
    print("│  Type 'exit' or 'quit' to end               │")
    print("╰" + "─" * 46 + "╯" + RESET)

    history = []

    while True:
        try:
            user_input = input(f"\n\033[1;33mYou:\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print()
            break

        if not user_input:
            continue
        if user_input.lower() in ("exit", "quit"):
            print("\033[1;31mGoodbye!\033[0m")
            break

        history.append({"role": "user", "parts": [user_input]})

        try:
            reply = provider.send_message(history, system_prompt=SYSTEM_PROMPT)
        except Exception as e:
            reply = f"Error: {e}"

        history.append({"role": "assistant", "parts": [reply]})

        print(f"\n{COLOR}── {label.upper()} ─────────────────────────{RESET}")
        print(reply)


if __name__ == "__main__":
    main()
