WEB_SEARCH_TOOL = {
    "name": "web_search",
    "description": "Search the web for current information. Uses a simulated search engine — replace with real Tavily/DuckDuckGo integration in production.",
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query string",
            },
            "max_results": {
                "type": "integer",
                "description": "Maximum number of search results to return (default: 5)",
            },
        },
        "required": ["query"],
    },
}

MOCK_RESULTS: dict[str, list[dict]] = {
    "weather in mumbai": [
        {"title": "Mumbai Weather - AccuWeather", "snippet": "Current conditions: 32°C, partly cloudy. Humidity: 74%, Wind: 15 km/h."},
        {"title": "Weather.com - Mumbai, India", "snippet": "Today's forecast: High 33°C, Low 27°C. Chance of rain: 20%."},
    ],
    "python ai news": [
        {"title": "Python AI Library Updates 2026", "snippet": "New releases: Anthropic SDK v1.0, OpenAI GPT-5 Python bindings, PyTorch 3.0."},
        {"title": "LangChain v1.0 Released", "snippet": "Production-ready agent framework with built-in tool use and observability."},
    ],
    "groovy web technologies": [
        {"title": "Groovy Web Technologies - About", "snippet": "Leading web development company specializing in AI-integrated full-stack applications."},
        {"title": "Groovy Web Careers", "snippet": "Join the team shaping the future of AI-assisted software development."},
    ],
    "latest ai models 2026": [
        {"title": "Claude 4 Sonnet Review", "snippet": "Anthropic's latest model shows significant improvements in tool use accuracy and instruction following."},
        {"title": "GPT-5 vs Claude 4 - Benchmark Comparison", "snippet": "Both models achieve >90% on tool-use evaluations. Claude leads in safety, GPT-5 in reasoning speed."},
    ],
}


def execute_web_search(_name: str, args: dict) -> str:
    query: str = args["query"]
    max_results: int = args.get("max_results", 5)
    query_lower = query.lower().strip()

    matched: list[dict] = []
    for key, results in MOCK_RESULTS.items():
        if key in query_lower or query_lower in key:
            matched.extend(results)

    if not matched:
        for key, results in MOCK_RESULTS.items():
            kw = key.split()
            if any(k in query_lower for k in kw):
                matched.extend(results)

    if not matched:
        return f"[Mock Web Search] No results found for '{query}'."

    limited = matched[:max_results]
    lines = [f"[Mock Web Search — {len(limited)} result(s)]"]
    for i, r in enumerate(limited, 1):
        lines.append(f"  {i}. {r['title']}")
        lines.append(f"     {r['snippet']}")
    return "\n".join(lines)
