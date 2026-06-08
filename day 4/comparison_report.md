# Multi-LLM Comparison Report
Date: 2026-06-08
Cohort: Groovy Web 2026-27

## Methodology
Five identical prompts were tested across three leading LLMs to evaluate performance in coding tasks and logical reasoning. Scoring is based on accuracy, conciseness, and adherence to modern best practices.

## Comparison Table

| Prompt | Claude 3.5 Sonnet | ChatGPT (GPT-4o) | Gemini 1.5 Pro | Winner |
| :--- | :---: | :---: | :---: | :--- |
| 1. useEffect vs useLayoutEffect | 10 | 9 | 9 | Claude |
| 2. Python Scraper w/ Pagination | 9 | 9 | 8 | Tie |
| 3. Code Refactoring Task | 10 | 9 | 9 | Claude |
| 4. Multi-tenant DB Schema | 9 | 10 | 9 | ChatGPT |
| 5. Secure CORS in FastAPI | 9 | 9 | 10 | Gemini |

## Summary Analysis

### Coding Tasks
Claude 3.5 Sonnet consistently provided the most "human-readable" and idiomatic code. Its refactoring capabilities are superior, often suggesting architectural improvements rather than just syntactic changes. ChatGPT (GPT-4o) remains highly reliable for structure and boilerplate generation.

### Logical Reasoning & Documentation
Gemini 1.5 Pro excelled in the FastAPI/CORS configuration task, providing the most up-to-date security context and clear documentation-style explanations. For schema design (multi-tenancy), ChatGPT's reasoning regarding database normalization and scalability was slightly more robust.

### Conclusion
* **Best for Refactoring/Writing:** Claude 3.5 Sonnet
* **Best for Complex Systems/Architecture:** ChatGPT (GPT-4o)
* **Best for Technical Integration/Docs:** Gemini 1.5 Pro
