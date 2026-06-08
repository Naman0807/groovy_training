# Day 13 — Tool Use · Function Calling · Code-Only

**Trainee:** Naman  
**Date:** Wednesday, June 24, 2026  
**Theme:** Tool use — teaching an LLM to call functions via JSON schemas  
**Deliverable:** Calculator agent + 3-tool agent (calculator / web search / Slack webhook)

---

## Table of Contents

1. [Tool Spec & JSON Schema Design](#1-tool-spec--json-schema-design)
2. [Calculator Agent — Build & Code](#2-calculator-agent--build--code)
3. [Web Search Integration](#3-web-search-integration)
4. [3-Tool Agent — Architecture](#4-3-tool-agent--architecture)
5. [Slack Webhook Setup](#5-slack-webhook-setup)
6. [Demo to Cohort — Notes & Feedback](#6-demo-to-cohort--notes--feedback)
7. [Daily Reflection](#7-daily-reflection)

---

## 1. Tool Spec & JSON Schema Design

### What is Tool Use (Function Calling)?

Tool use is the pattern where an LLM **declares intent to call a function** rather than producing the output directly. The developer:

1. Provides a JSON schema describing each available tool (name, description, parameters).
2. The LLM decides _when_ and _with what arguments_ to call a tool.
3. The developer executes the tool locally and returns the result to the LLM.
4. The LLM incorporates the result into its final response.

This is **not** the LLM executing code — it's the LLM _requesting_ that a function be executed, then reasoning about the result.

### JSON Schema for Tools

Gemini's function declaration format requires three fields per tool:

| Field         | Type     | Description                                                                                                          |
| :------------ | :------- | :------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string` | Tool identifier — used to dispatch execution                                                                         |
| `description` | `string` | Explains _when_ the LLM should use this tool (critical for correct routing)                                          |
| `parameters`  | `object` | Standard JSON Schema defining the tool's parameters (Gemini uses `parameters` instead of Anthropic's `input_schema`) |

### Example Schemas

**Simple:**

```json
{
	"name": "sqrt",
	"description": "Calculate the square root of a non-negative number",
	"parameters": {
		"type": "object",
		"properties": {
			"value": {
				"type": "number",
				"description": "The number to find the square root of"
			}
		},
		"required": ["value"]
	}
}
```

**Complex (multi-param):**

```json
{
	"name": "web_search",
	"description": "Search the web for current information",
	"parameters": {
		"type": "object",
		"properties": {
			"query": {
				"type": "string",
				"description": "The search query string"
			},
			"max_results": {
				"type": "integer",
				"description": "Maximum results to return (default 5)"
			}
		},
		"required": ["query"]
	}
}
```

### Key Design Rules (Learned)

1. **Description is the router** — If descriptions are vague, the LLM calls the wrong tool. `"Add two numbers"` vs `"Add two numbers together"` — both work, but being precise about edge cases matters.
2. **Parameter descriptions help too** — `"Dividend (numerator)"` vs `"First number"` changes how the LLM maps user language to parameters.
3. **Error handling must be in the executor** — The schema can enforce types but can't enforce runtime constraints (e.g., division by zero, sqrt of negative).
4. **Return strings only** — Gemini function responses must contain string-serializable data. Complex data must be serialized (JSON) before returning.

---

## 2. Calculator Agent — Build & Code

### Implementation

**File:** `tool-agent/calculator_agent.py`

The calculator agent implements the full tool-use loop:

```
User: "what is 144 * 0.5?"
  → chat.send_message("what is 144 * 0.5?")
  → Response: function_call { name: "multiply", args: {a: 144, b: 0.5} }
  → Execute multiply(144, 0.5) → "72.0"
  → chat.send_message(FunctionResponse { name: "multiply", response: {result: "72.0"} })
  → Response: text "144 × 0.5 = 72"
```

### Tool Definitions (6 tools)

| Tool       | Schema Type      | Params         | Edge Case                       |
| :--------- | :--------------- | :------------- | :------------------------------ |
| `add`      | `number, number` | a, b           | —                               |
| `subtract` | `number, number` | a, b           | —                               |
| `multiply` | `number, number` | a, b           | —                               |
| `divide`   | `number, number` | a, b           | Division by zero → error string |
| `power`    | `number, number` | base, exponent | —                               |
| `sqrt`     | `number`         | value          | Negative → error string         |

### Code Pattern

```python
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash-lite",
    tools=CALCULATOR_TOOLS_GEMINI,
    system_instruction=SYSTEM_PROMPT,
)
chat = model.start_chat()
response = chat.send_message(user_input)

for part in response.parts:
    if part.function_call:
        fc = part.function_call
        result = execute_tool(fc.name, dict(fc.args))
        response = chat.send_message(
            genai.protos.Content(
                parts=[
                    genai.protos.Part(
                        function_response=genai.protos.FunctionResponse(
                            name=fc.name,
                            response={"result": result},
                        )
                    )
                ]
            )
        )
```

### Test Results

| Query                 | Tool(s) Called           | Result                       | Correct?       |
| :-------------------- | :----------------------- | :--------------------------- | :------------- |
| "2 + 2"               | add(2, 2)                | 4                            | ✓              |
| "100 / 3"             | divide(100, 3)           | 33.33...                     | ✓              |
| "5 to the power of 3" | power(5, 3)              | 125                          | ✓              |
| "sqrt of 144"         | sqrt(144)                | 12                           | ✓              |
| "divide 10 by 0"      | divide(10, 0)            | "Error: division by zero"    | ✓              |
| "sqrt of -4"          | sqrt(-4)                 | "Error: cannot calculate..." | ✓              |
| "what is (2+3)\*4?"   | add(2,3) → multiply(5,4) | 20                           | ✓ (multi-step) |

---

## 3. Web Search Integration

**File:** `tool-agent/tools/web_search.py`

### Mock Implementation

Since we don't have a real API key for Tavily (free tier requires registration), we implemented a **mock search engine** with predefined result sets:

```python
MOCK_RESULTS = {
    "weather in mumbai": [
        {"title": "Mumbai Weather - AccuWeather", "snippet": "32°C, partly cloudy..."},
        {"title": "Weather.com - Mumbai", "snippet": "High 33°C, Low 27°C..."},
    ],
    "python ai news": [...],
    "groovy web technologies": [...],
    "latest ai models 2026": [...],
}
```

### Production Path

To replace with real Tavily:

```python
import requests

def execute_web_search(_name, args):
    resp = requests.post(
        "https://api.tavily.com/search",
        json={"api_key": TAVILY_API_KEY, "query": args["query"]},
    )
    return resp.json()
```

Or DuckDuckGo (no API key needed):

```python
from duckduckgo_search import DDGS

def execute_web_search(_name, args):
    with DDGS() as ddgs:
        results = list(ddgs.text(args["query"], max_results=5))
    return json.dumps(results)
```

---

## 4. 3-Tool Agent — Architecture

**File:** `tool-agent/agent.py`

### Tool Registry

All tools are registered in `tools/__init__.py`:

```python
def _to_gemini_tools(*tool_defs: dict) -> list[dict]:
    function_declarations = []
    for td in tool_defs:
        function_declarations.append({
            "name": td["name"],
            "description": td["description"],
            "parameters": td.get("parameters", td.get("input_schema", {})),
        })
    return [{"function_declarations": function_declarations}]

ALL_TOOLS = _to_gemini_tools(*CALCULATOR_TOOLS, WEB_SEARCH_TOOL, SLACK_WEBHOOK_TOOL)

TOOL_DISPATCH = {
    "add": execute_calculator,
    "subtract": execute_calculator,
    # ... all calculator tools map to execute_calculator
    "web_search": execute_web_search,
    "slack_notify": execute_slack_webhook,
}
```

### Dispatch Pattern

The `execute_tool()` function in `__init__.py` provides a unified interface:

```python
def execute_tool(name: str, args: dict) -> str:
    handler = TOOL_DISPATCH.get(name)
    if handler is None:
        return f"Unknown tool: {name}"
    return handler(name, args)
```

This lets the agent loop treat every tool identically:

```python
for part in response.parts:
    if part.function_call:
        fc = part.function_call
        result = execute_tool(fc.name, dict(fc.args))
        # send FunctionResponse back via chat.send_message(...)
```

### Test Scenarios

| User Query                               | Expected Tool Flow                                    |
| :--------------------------------------- | :---------------------------------------------------- |
| "What's 42 \* 7?"                        | multiply(42, 7)                                       |
| "Search for Groovy Web"                  | web_search("Groovy Web Technologies")                 |
| "Send a message to #random saying hello" | slack_notify("#random", "hello")                      |
| "Search AI news and post to #general"    | web_search("AI news") → slack_notify("#general", ...) |
| "Calculate 15% of 200"                   | multiply(200, 0.15)                                   |

---

## 5. Slack Webhook Setup

**File:** `tool-agent/tools/slack_webhook.py`

### Mock Implementation

The Slack tool simulates sending a message by printing the payload:

```python
def execute_slack_webhook(_name, args):
    payload = {
        "channel": args["channel"],
        "text": args["message"],
        "username": "Groovy Bot",
        "icon_emoji": ":robot_face:",
    }
    return f"[Slack Webhook — Simulated]\n  Channel: {channel}\n  Message: {message}\n  Status: delivered ✓\n  Payload: {json.dumps(payload, indent=4)}"
```

### Production Path

Replace with a real Slack Incoming Webhook:

```python
import requests

SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/..."

def execute_slack_webhook(_name, args):
    payload = {"channel": args["channel"], "text": args["message"]}
    resp = requests.post(SLACK_WEBHOOK_URL, json=payload)
    resp.raise_for_status()
    return f"Message sent to {args['channel']} ✓"
```

### Webhook Setup Steps (Production)

1. Go to https://api.slack.com/apps → Create New App
2. Enable **Incoming Webhooks**
3. Click **Add New Webhook to Workspace** → select channel
4. Copy the webhook URL (ends in `/services/...`)
5. Set as `SLACK_WEBHOOK_URL` environment variable

---

## 6. Demo to Cohort — Notes & Feedback

**Time:** 11:30 AM — 12:00 PM  
**Audience:** Krunal, Rahul, Nauman, Parth, Dhruti + 5 cohort members

### Demo Flow

1. **(3 min)** Explained the tool-use concept — LLM declares intent, we execute, LLM reasons about result
2. **(3 min)** Ran `calculator_agent.py` — showed `2+2`, `sqrt(144)`, `(2+3)*4` multi-step
3. **(3 min)** Showed edge cases — division by zero, sqrt of negative — agent handled gracefully
4. **(4 min)** Switched to `agent.py` — searched "weather in mumbai", then "send result to #day-13"
5. **(2 min)** Showed the tool registry in `__init__.py` and how dispatch works
6. **(2 min)** Q&A

### Feedback

- **Krunal:** "Good demo. The tool registry pattern is clean — every tool has the same signature, so the agent loop doesn't need special cases. That's exactly how production agents should work."
- **Rahul:** "The mock search needs actual data for the demo. Maybe pre-seed some realistic results or show the DuckDuckGo integration path."
- **Nauman:** "Next step: add a `weather` tool with real API integration so the agent can answer weather queries natively instead of searching."
- **Dhruti:** "The multi-step tool use (search then post to Slack) was impressive. How does the LLM decide to chain them? — _Answer: The system prompt tells it to 'use tools sequentially' when a task requires multiple steps._"
- **Parth:** "Could you add a `read_file` tool so the agent can work with files? — _Noted for v2._"

### Issues During Demo

1. **Gemini API quota limits** — Free tier has rate limits (60 req/min). First burst of multi-step calls triggered a 429. Retried after 2 seconds and it worked.
   - **Lesson:** Add retry logic with exponential backoff for production.
2. **Slack mock formatting** — The `\n` in the simulated payload showed literal `\n` in the terminal instead of newlines (Windows terminal issue). Fixed by using `os.linesep`.
   - **Lesson:** Always test terminal output formatting on the target OS.

---

## 7. Daily Reflection

> [!TIP]
> **Biggest takeaway:** Tool use is the fundamental building block of LLM agents. The pattern — define schemas, let the LLM decide, execute, return results — is simple but incredibly powerful. The real challenge isn't the API call, it's **tool design**: writing descriptions clear enough that the LLM correctly routes queries, and handling edge cases in the executor.

### Stats

| Metric                             | Value                                                           |
| :--------------------------------- | :-------------------------------------------------------------- |
| Lines of code (all agents + tools) | ~350                                                            |
| Tool definitions written           | 8 (6 calculator + search + slack)                               |
| JSON schemas designed              | 8                                                               |
| Edge cases handled                 | 4 (div by 0, negative sqrt, unknown tool, empty search results) |
| Multi-step workflows tested        | 3 (chain calc, search→slack, calc→search)                       |
| Demo time                          | ~17 min                                                         |
| API calls during testing           | ~25                                                             |
| Total API cost for the day         | ~$0.00 (Gemini free tier)                                       |
| Key takeaway                       | Tool descriptions are the router — invest in them               |

### Key Learning

| Concept                   | Understanding                                                                                                                                        |
| :------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| JSON Schema `parameters`  | Each property needs `type` + `description`. `required` array lists mandatory params. Gemini uses `parameters` instead of Anthropic's `input_schema`. |
| Gemini function_call part | `part.function_call.name`, `part.function_call.args`, `dict(fc.args)`                                                                                |
| Function response format  | `FunctionResponse(name=fc.name, response={"result": str(result)})` sent via `chat.send_message(Content(parts=[Part(function_response=...)]))`        |
| Multi-turn tool loop      | if function_call → execute → send FunctionResponse via `chat.send_message()` → repeat until text response                                            |
| Tool dispatch pattern     | Dict mapping `name -> handler` lets all tools share the same agent loop                                                                              |

---

## Summary

Day 13 was the **tool use deep dive** — the core pattern that makes LLM agents possible. I built two agents (calculator-only and 3-tool) demonstrating the complete Google Gemini function calling workflow: define function declarations, let the LLM decide which tool to call, execute locally, return results via `FunctionResponse`, iterate until the LLM produces a final answer. The tool registry pattern (`ALL_TOOLS` + `TOOL_DISPATCH`) keeps the agent loop clean and extensible — adding a new tool is just a new file in `tools/` plus a line in the registry. The `_to_gemini_tools()` helper transparently converts traditional tool dicts into Gemini's `function_declarations` format.

**Tomorrow (Day 14):** Agent orchestration — multiple agents working together, handoffs, and task planning.
