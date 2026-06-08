# Codebase Explainer

Two CLI tools (Python + Node.js) that take a project directory and a question, send relevant code context (≤10K tokens) to Gemini, and return a natural-language explanation.

## Usage

```bash
# Python
python explain.py /path/to/project "How does authentication work?"

# Node.js
node explain.js /path/to/project "What is the data model for users?"
```

## How It Works

1. **File discovery** — walks the directory, collecting files with allowed extensions (.py, .js, .ts, .jsx, .tsx, .json, .yaml, .md, .html, .css, .sql, .rs, .go, .java, .rb) under 5 KB each.
2. **Context budget** — fills up to 10K tokens using a "head + tail" strategy (first ~2,000 chars + last ~500 chars) to preserve imports and closing logic.
3. **Token counting** — uses Gemini's `count_tokens()` API (Python) or character-based estimation (Node) instead of tiktoken.
4. **Telemetry** — every API call is logged to `../token-tracker/telemetry.csv`.

## Dependencies

### Python

```bash
pip install google-generativeai
```

### Node.js

```bash
npm install @google/generative-ai
```

## Environment

Set `GEMINI_API_KEY` in your environment:

```bash
export GEMINI_API_KEY="AIzaSy..."
```

## Design Decisions

| Decision               | Rationale                                                        |
| :--------------------- | :--------------------------------------------------------------- |
| 10K token limit        | Keeps costs predictable; forces smart file selection             |
| Head + tail truncation | Preserves imports (head) and return/logic (tail)                 |
| 5 KB file cap          | Excludes large generated files (lockfiles, bundles)              |
| Allowed extensions     | Focuses on source code; excludes binaries, images, audio         |
| Gemini 2.5 Flash       | $0.10/M input, $0.40/M output — 30× cheaper than Sonnet on input |

## Example

```bash
$ python explain.py ~/groovy/days/day-2/todo-app \
  "How does the frontend communicate with the backend?"

Files analyzed: 7 (9,128 tokens)

> The frontend (React app in `frontend/src/App.js`) communicates with
> the backend (Express server in `backend/server.js`) via direct HTTP
> calls using the browser `fetch()` API, all targeting
> `http://localhost:3001`.
>
> • The App component calls `fetch("http://localhost:3001/todos")` on
>   mount inside a useEffect hook.
> • New todos are POSTed to the same origin with JSON body.
> • Toggle and delete use PUT and DELETE respectively.
> • The backend stores data in-memory (array) and returns JSON.
> • No authentication, no WebSockets — simple CRUD over REST.

Model: gemini-2.5-flash-lite | Cost: $0.0001
```
