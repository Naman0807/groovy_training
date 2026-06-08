"""LlamaIndex agent with web search + calculator tool use."""
import asyncio
import os
from dotenv import load_dotenv
from llama_index.core.agent.workflow import ReActAgent
from llama_index.core.tools import FunctionTool
from llama_index.llms.google_genai import GoogleGenAI

load_dotenv()


def web_search(query: str) -> str:
    """Search the web and return results."""
    from duckduckgo_search import DDGS
    results = DDGS().text(query, max_results=3)
    return "\n".join(r["body"] for r in results)


def calculator(expression: str) -> str:
    """Evaluate a mathematical expression."""
    try:
        return str(eval(expression, {"__builtins__": {}}, {"abs": abs, "round": round}))
    except Exception as e:
        return f"Error: {e}"


tools = [
    FunctionTool.from_defaults(fn=web_search),
    FunctionTool.from_defaults(fn=calculator),
]

llm = GoogleGenAI(
    model="models/gemini-2.5-flash-lite",
    api_key=os.getenv("GEMINI_API_KEY"),
)

agent = ReActAgent(tools=tools, llm=llm, verbose=True)


async def main():
    while True:
        query = input("\nYou: ")
        if query.lower() in ("exit", "quit"):
            break
        response = await agent.run(user_msg=query)
        # response is a StopEvent; extract the response text
        if hasattr(response, 'result') and isinstance(response.result, dict):
            result_text = response.result.get("response", str(response))
        else:
            result_text = str(response)
        print(f"Agent: {result_text}")


if __name__ == "__main__":
    asyncio.run(main())
