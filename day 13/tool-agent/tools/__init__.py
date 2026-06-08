from google.genai import types

from .calculator import CALCULATOR_TOOLS, execute_calculator
from .web_search import WEB_SEARCH_TOOL, execute_web_search
from .slack_webhook import SLACK_WEBHOOK_TOOL, execute_slack_webhook


def to_gemini_tools(*tool_defs: dict) -> list[types.Tool]:
    declarations = []
    for td in tool_defs:
        declarations.append(
            types.FunctionDeclaration(
                name=td["name"],
                description=td["description"],
                parameters=td.get("parameters", td.get("input_schema", {})),
            )
        )
    return [types.Tool(function_declarations=declarations)]


ALL_TOOLS = to_gemini_tools(*CALCULATOR_TOOLS, WEB_SEARCH_TOOL, SLACK_WEBHOOK_TOOL)
ALL_CALCULATOR_TOOLS = to_gemini_tools(*CALCULATOR_TOOLS)

TOOL_DISPATCH = {
    "add": execute_calculator,
    "subtract": execute_calculator,
    "multiply": execute_calculator,
    "divide": execute_calculator,
    "power": execute_calculator,
    "sqrt": execute_calculator,
    "web_search": execute_web_search,
    "slack_notify": execute_slack_webhook,
}


def execute_tool(name: str, args: dict) -> str:
    handler = TOOL_DISPATCH.get(name)
    if handler is None:
        return f"Unknown tool: {name}"
    return handler(name, args)


__all__ = [
    "ALL_TOOLS",
    "ALL_CALCULATOR_TOOLS",
    "execute_tool",
    "to_gemini_tools",
    "execute_calculator",
    "execute_web_search",
    "execute_slack_webhook",
]
