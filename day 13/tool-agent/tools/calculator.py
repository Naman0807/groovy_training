import math

CALCULATOR_TOOLS = [
    {
        "name": "add",
        "description": "Add two numbers together",
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "First addend"},
                "b": {"type": "number", "description": "Second addend"},
            },
            "required": ["a", "b"],
        },
    },
    {
        "name": "subtract",
        "description": "Subtract the second number from the first number",
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "Number to subtract from (minuend)"},
                "b": {"type": "number", "description": "Number to subtract (subtrahend)"},
            },
            "required": ["a", "b"],
        },
    },
    {
        "name": "multiply",
        "description": "Multiply two numbers",
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "First factor"},
                "b": {"type": "number", "description": "Second factor"},
            },
            "required": ["a", "b"],
        },
    },
    {
        "name": "divide",
        "description": "Divide the first number by the second number",
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "Dividend (numerator)"},
                "b": {"type": "number", "description": "Divisor (denominator)"},
            },
            "required": ["a", "b"],
        },
    },
    {
        "name": "power",
        "description": "Raise a base number to a given exponent",
        "input_schema": {
            "type": "object",
            "properties": {
                "base": {"type": "number", "description": "The base number"},
                "exponent": {"type": "number", "description": "The exponent to raise the base to"},
            },
            "required": ["base", "exponent"],
        },
    },
    {
        "name": "sqrt",
        "description": "Calculate the square root of a non-negative number",
        "input_schema": {
            "type": "object",
            "properties": {
                "value": {"type": "number", "description": "The number to find the square root of (must be non-negative)"},
            },
            "required": ["value"],
        },
    },
]


def execute_calculator(name: str, args: dict) -> str:
    if name == "add":
        return str(args["a"] + args["b"])
    elif name == "subtract":
        return str(args["a"] - args["b"])
    elif name == "multiply":
        return str(args["a"] * args["b"])
    elif name == "divide":
        if args["b"] == 0:
            return "Error: division by zero"
        return str(args["a"] / args["b"])
    elif name == "power":
        return str(args["base"] ** args["exponent"])
    elif name == "sqrt":
        if args["value"] < 0:
            return "Error: cannot calculate square root of a negative number"
        return str(math.sqrt(args["value"]))
    return f"Unknown calculator tool: {name}"
