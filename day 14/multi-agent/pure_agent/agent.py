"""Pure SDK agent loop — no framework. Uses Google Gemini API directly."""

import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from duckduckgo_search import DDGS

load_dotenv()

TOOLS = [
    types.Tool(function_declarations=[
        types.FunctionDeclaration(
            name="web_search",
            description="Search the web for current information",
            parameters={
                "type": "object",
                "properties": {"query": {"type": "string", "description": "search query"}},
                "required": ["query"],
            },
        ),
        types.FunctionDeclaration(
            name="calculator",
            description="Evaluate a mathematical expression",
            parameters={
                "type": "object",
                "properties": {
                    "expression": {"type": "string", "description": "Python math expression"}
                },
                "required": ["expression"],
            },
        ),
    ]),
]


def web_search(query: str) -> str:
    results = DDGS().text(query, max_results=3)
    return "\n".join(r["body"] for r in results)


def calculator(expression: str) -> str:
    try:
        return str(eval(expression, {"__builtins__": {}}, {"abs": abs, "round": round}))
    except Exception as e:
        return f"Error: {e}"


def execute_tool(name: str, args: dict) -> str:
    if name == "web_search":
        return web_search(args["query"])
    elif name == "calculator":
        return calculator(args["expression"])
    raise ValueError(f"Unknown tool: {name}")


client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))


def agent_loop(user_input: str, messages: list) -> str:
    messages.append(types.Content(role="user", parts=[types.Part(text=user_input)]))

    while True:
        response = client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=messages,
            config=types.GenerateContentConfig(
                system_instruction="You are a helpful AI assistant. Use tools to answer accurately.",
                tools=TOOLS,
            ),
        )

        candidate = response.candidates[0]
        content = candidate.content

        # Check if the response was blocked by safety filters
        if candidate.finish_reason and candidate.finish_reason.name not in ("STOP", "MAX_TOKENS"):
            error_msg = f"Response blocked. Finish reason: {candidate.finish_reason.name}"
            if candidate.safety_ratings:
                error_msg += f" (safety ratings: {[r.category.name for r in candidate.safety_ratings]})"
            messages.pop()  # remove the last user message so next turn doesn't compound
            return f"[{error_msg}]"

        if not content or not content.parts:
            messages.pop()
            return "[Empty response from model — please rephrase your question.]"

        part = content.parts[0]

        if part.text:
            messages.append(types.Content(role="model", parts=[types.Part(text=part.text)]))
            return part.text

        if part.function_call:
            fc = part.function_call
            result = execute_tool(fc.name, {k: v for k, v in fc.args.items()})
            messages.append(
                types.Content(role="model", parts=[types.Part.from_function_call(name=fc.name, args=dict(fc.args))])
            )
            messages.append(
                types.Content(role="user", parts=[types.Part.from_function_response(
                    name=fc.name,
                    response={"result": result},
                )])
            )


if __name__ == "__main__":
    messages = []
    while True:
        query = input("\nYou: ")
        if query.lower() in ("exit", "quit"):
            break
        answer = agent_loop(query, messages)
        print(f"Agent: {answer}")
