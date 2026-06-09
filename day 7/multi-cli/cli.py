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


def load_available_providers():
    available = {}
    for name, config in PROVIDER_CONFIG.items():
        api_key = os.environ.get(config["env_key"])
        if not api_key:
            print(f"Warning: {config['env_key']} not set — {name} unavailable", file=sys.stderr)
            continue
        try:
            provider = config["class"](api_key)
            available[name] = provider
        except Exception as e:
            print(f"Warning: {name} failed to initialize: {e}", file=sys.stderr)
    return available


def build_fallback_chain(preferred, available):
    chain = []
    names_in_order = list(PROVIDER_CONFIG.keys())

    if preferred in names_in_order:
        names_in_order.remove(preferred)
        names_in_order.insert(0, preferred)

    for name in names_in_order:
        if name in available:
            provider = available[name]
            config = PROVIDER_CONFIG[name]
            chain.append((name, provider, config))

    return chain


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

    available_providers = load_available_providers()

    if not available_providers:
        print("Error: No API keys found. Set at least one in your .env file.", file=sys.stderr)
        sys.exit(1)

    fallback_chain = build_fallback_chain(args.provider, available_providers)

    first_name, first_provider, first_config = fallback_chain[0]
    COLOR = first_config["color"]
    label = first_config["label"]

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

        reply = None
        errors = []
        used_name = None
        used_config = None

        for name, provider, config in fallback_chain:
            try:
                result = provider.send_message(history, system_prompt=SYSTEM_PROMPT)
            except Exception as e:
                result = f"Error: {e}"

            if result.startswith("Error:"):
                errors.append(f"  {config['label']}: {result}")
                continue

            reply = result
            used_name = name
            used_config = config
            break

        if reply is None:
            reply = "All providers failed:\n" + "\n".join(errors)
            history.append({"role": "assistant", "parts": [reply]})
            print(f"\n\033[1;31m── ALL PROVIDERS FAILED ─────────────────\033[0m")
            print(reply)
        else:
            history.append({"role": "assistant", "parts": [reply]})
            print(f"\n{used_config['color']}── {used_config['label'].upper()} ─────────────────────────{RESET}")
            print(reply)


if __name__ == "__main__":
    main()
