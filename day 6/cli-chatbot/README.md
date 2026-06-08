# GroovyBot — CLI Multi-Turn Chatbot

Multi-turn CLI chatbot built with the Gemini API. Three implementations for Day 6 of Groovy Web 30-Day training.

## Files

| File               | Description                                                                          |
| :----------------- | :----------------------------------------------------------------------------------- |
| `chatbot.py`       | Python — uses `google-generativeai` SDK, full conversation history, color output     |
| `chatbot.js`       | Node.js — uses `@google/generative-ai`, full conversation history, color output      |
| `chat.sh`          | Bash — single-turn prompt via `curl`, pipes response through Python for JSON parsing |
| `requirements.txt` | Python dependency (`google-generativeai>=0.8.0`)                                     |
| `package.json`     | Node.js dependency (`@google/generative-ai`)                                         |
    
## Setup

### 1. API Key

Copy `.env.example` to `.env` and add your key:

```bash
cp .env.example .env
# Edit .env: GEMINI_API_KEY=AIzaSy...
```

Or export it in your shell:

```bash
export GEMINI_API_KEY="AIzaSy..."
```

### 2. Python

```bash
pip install -r requirements.txt
python chatbot.py
```

### 3. Node.js

```bash
npm install
npm start
# or: node chatbot.js
```

### 4. Bash

```bash
chmod +x chat.sh
./chat.sh "What is the capital of France?"
```

## Usage

- **Python / Node.js:** Type messages in the REPL loop. Type `exit` or `quit` to end.
- **Bash:** Pass your prompt as a command-line argument (single-turn only).
- The chatbot maintains conversation history across turns (Python and Node.js versions).
- Errors (rate limits, connection issues, API errors) are caught and displayed gracefully.

## Notes

- Uses `gemini-2.5-flash-lite` by default
- Max output: 1024 tokens per response
- System prompt sets a friendly, concise persona
