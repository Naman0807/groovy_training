#!/usr/bin/env python3
"""Streaming Demo — Shows raw streaming chunks from the Gemini API.

Run:
    python streaming_demo.py

You'll see every chunk emitted during a streaming response.
"""

import os
import sys

from dotenv import load_dotenv

from google import genai
from google.genai import types


def main():
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    print("\033[1;36m" + "═" * 50)
    print("  Gemini Streaming Demo — Raw Chunks")
    print("═" * 50 + "\033[0m\n")

    prompt = "Write a short haiku about server-sent events."

    print(f"Prompt: \033[1;33m{prompt}\033[0m\n")
    print("\033[1;34m── Raw Chunk Stream ────────────────────────────────\033[0m\n")

    chunk_count = 0
    collected_text = []

    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction="You are a demo assistant. Be concise and creative.",
        ),
        stream=True,
    )

    for chunk in response:
        chunk_count += 1

        text = chunk.text if chunk.text else ""

        # Print chunk header
        print(f"\033[1;32m[{chunk_count:02d}] Chunk received:\033[0m")

        # Print the text content
        if text:
            print(f"       text: \033[1;33m{text!r}\033[0m")
        else:
            print(f"       text: (empty — likely final metadata chunk)")

        # Check finish reason on the last chunk
        if chunk.candidates:
            for candidate in chunk.candidates:
                finish = candidate.finish_reason
                if finish and finish.name != "FINISH_REASON_UNSPECIFIED":
                    print(f"       finish_reason: {finish.name}")

        print()
        collected_text.append(text)

    # Summary
    print("\033[1;34m── Summary ───────────────────────────────────────\033[0m\n")
    print(f"Total chunks received: \033[1;33m{chunk_count}\033[0m")
    print(f"Full response: \033[1;33m{''.join(collected_text)}\033[0m")
    print(f"Response length: \033[1;33m{len(''.join(collected_text))} chars\033[0m")


if __name__ == "__main__":
    main()
