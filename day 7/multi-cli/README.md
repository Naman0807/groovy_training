# GroovyBot — Multi-Provider CLI Chatbot

Multi-turn CLI chatbot supporting **Google Gemini**, **OpenAI**, and **Anthropic Claude**.

---

## Setup

### 1. API Keys

Get your keys from:
- **Gemini**: [aistudio.google.com](https://aistudio.google.com) → Get API Key
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Claude**: [console.anthropic.com](https://console.anthropic.com/)

Copy `.env.example` to `.env` and add your keys:

```bash
cp .env.example .env
```

```
GEMINI_API_KEY=AIza...
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-claude-key-here
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run

```bash
# Default (Gemini)
python cli.py

# Specific provider
python cli.py --provider openai
python cli.py --provider claude
python cli.py -p gemini
```

---

## Usage

```
╭──────────────────────────────────────────────╮
│  🤖 GroovyBot — Gemini 2.5 Flash            │
│  Type 'exit' or 'quit' to end               │
╰──────────────────────────────────────────────╯
```

| Command | Description |
| :------ | :---------- |
| `--provider`, `-p` | Choose provider: `gemini`, `openai`, or `claude` (default: `gemini`) |
| `exit` / `quit` | End the session |

---

## Files

| File | Description |
| :--- | :---------- |
| `cli.py` | Main entry point — multi-provider REPL loop with colored output |
| `providers/gemini_provider.py` | Google Gemini API implementation |
| `providers/openai_provider.py` | OpenAI API implementation |
| `providers/claude_provider.py` | Anthropic Claude API implementation |
| `cost_report.csv` | Mock cost data for 50 prompts using Gemini 2.5 Flash |
| `decision_matrix.md` | Gemini model selection guide (Flash vs Pro vs Ultra) |
| `requirements.txt` | Python dependencies |
| `.env.example` | API key template |

---

## Color Coding

| Provider | Color |
| :------- | :---- |
| Gemini | Blue |
| OpenAI | Green |
| Claude | Magenta |

---

## Error Handling

The CLI catches API errors and displays user-friendly messages for:
- Missing or invalid API keys
- Rate limit exceeded
- Network / connection failures
- API-level errors
