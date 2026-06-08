# Groovy Agent — Tool Use & Function Calling (Gemini)

Day 13 project demonstrating Google Gemini's **function calling** API. Two agents are implemented: a calculator-only agent and a 3-tool agent.

---

## Setup

```bash
pip install -r requirements.txt
export GEMINI_API_KEY=AIzaSyBflmoriU_JnEgGliF0yrsLqoFWSVQbKzk
```

---

## Agents

### 1. Calculator Agent

Interactive CLI that uses Gemini's function calling API with 6 calculator tools.

```bash
python calculator_agent.py
```

**Tools:**

| Tool       | Description              | Parameters                        |
| :--------- | :----------------------- | :-------------------------------- |
| `add`      | Add two numbers          | `a: number`, `b: number`          |
| `subtract` | Subtract two numbers     | `a: number`, `b: number`          |
| `multiply` | Multiply two numbers     | `a: number`, `b: number`          |
| `divide`   | Divide two numbers       | `a: number`, `b: number`          |
| `power`    | Raise base to exponent   | `base: number`, `exponent: number` |
| `sqrt`     | Square root of a number  | `value: number`                   |

**Example session:**

```
You: what is 2 + 2?
  └─ Tool: add({'a': 2, 'b': 2})
     Result: 4
Assistant: 2 + 2 = 4.

You: what is the square root of 144?
  └─ Tool: sqrt({'value': 144})
     Result: 12.0
Assistant: The square root of 144 is 12.
```

### 2. Three-Tool Agent

Interactive CLI with calculator, web search, and Slack notification tools.

```bash
python agent.py
```

**Tools:**

| Tool            | Description                 | Parameters                                    |
| :-------------- | :-------------------------- | :-------------------------------------------- |
| Calculator (6)  | Math operations             | _(see calculator agent above)_                |
| `web_search`    | Mock web search             | `query: string`, `max_results?: integer`      |
| `slack_notify`  | Mock Slack webhook message  | `channel: string`, `message: string`          |

**Example session:**

```
You: search the web for latest AI news
  └─ Tool: web_search({'query': 'latest AI news 2026', 'max_results': 5})
     Result: [Mock Web Search — 2 result(s)]...
Assistant: Here are the latest AI news results...

You: send a slack notification to #general saying "AI news updated"
  └─ Tool: slack_notify({'channel': '#general', 'message': 'AI news updated'})
     Result: [Slack Webhook — Simulated]...
Assistant: Done! Message sent to #general.
```

---

## Tool Architecture

Each tool follows the same pattern:

1. **Function Declaration** — A dict (or `genai.protos.FunctionDeclaration`) defining the tool's name, description, and `parameters` (JSON Schema format).
2. **Executor function** — A Python function that takes `(name: str, args: dict) -> str` and returns the result as a string.

```python
FUNCTION_DECLARATION = {
    "name": "tool_name",
    "description": "What this tool does",
    "parameters": {
        "type": "object",
        "properties": {
            "param1": {"type": "string", "description": "..."},
        },
        "required": ["param1"],
    },
}

def execute_tool(name: str, args: dict) -> str:
    # implementation
    return result_string
```

Tools are registered in `tools/__init__.py` via `ALL_TOOLS` and `TOOL_DISPATCH`. The `_to_gemini_tools()` helper converts Anthropic-style tool dicts (with `input_schema`) into Gemini's `function_declarations` format automatically.

---

## Gemini Function Calling Flow

1. User sends a message to the Gemini model via `chat.send_message()`.
2. The model responds with either text or `function_call` parts.
3. If `function_call`: execute the tool locally, send the result back as a `FunctionResponse`.
4. Model responds with the final answer (may call additional tools).
5. Repeat until the model responds with text only.

---

## Mock Tools

- **`web_search`** — Returns simulated results for known queries (`weather in mumbai`, `python ai news`, `groovy web technologies`, `latest ai models 2026`). Replace with real Tavily API or DuckDuckGo in production.
- **`slack_notify`** — Logs the payload to stdout instead of making an HTTP request. Replace with `requests.post(WEBHOOK_URL, json=payload)` in production.

---

## Project Structure

```
tool-agent/
├── README.md
├── requirements.txt
├── .env.example
├── calculator_agent.py    # Calculator-only agent
├── agent.py               # 3-tool agent (calculator + search + slack)
└── tools/
    ├── __init__.py         # Tool registry, dispatch, Gemini conversion
    ├── calculator.py       # 6 calculator tools + executor
    ├── web_search.py       # Mock web search tool
    └── slack_webhook.py    # Mock Slack webhook tool
```
