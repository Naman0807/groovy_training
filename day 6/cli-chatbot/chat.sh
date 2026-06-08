#!/usr/bin/env bash
# GroovyBot — simple single-turn prompt via curl
# Usage: ./chat.sh "your prompt here"

set -euo pipefail

if [ -z "${GEMINI_API_KEY:-}" ]; then
  echo "Error: GEMINI_API_KEY environment variable not set." >&2
  exit 1
fi

PROMPT="${1:-"Say hello from the Bash CLI chatbot!"}"

echo "────────────────────────────────────────────"
echo "  🤖 GroovyBot (curl)"
echo "────────────────────────────────────────────"
echo "You: $PROMPT"
echo ""

curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$(cat <<EOF
{
  "system_instruction": {
    "parts": [{"text": "You are GroovyBot, a CLI chatbot. Be concise and friendly."}]
  },
  "contents": [
    {"role": "user", "parts": [{"text": "$PROMPT"}]}
  ]
}
EOF
)" | python3 -c "
import sys, json
resp = json.load(sys.stdin)
if 'error' in resp:
    print(f\"Error: {resp['error']}\")
else:
    print(resp['candidates'][0]['content']['parts'][0]['text'])
"
