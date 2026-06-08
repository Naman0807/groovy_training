# Day 3: Prompt Engineering Bootcamp

## Exercise 1: Bad Prompt to Good Prompt Refactoring

| Original (Bad) Prompt | Optimized (Good) Prompt                                                                                                                                        |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Make a game."        | "Create a simple Tic-Tac-Toe game using React and Tailwind CSS. Include a reset button and a display for the current turn."                                    |
| "Help with bug."      | "I am getting a `TypeError: Cannot read property 'map' of undefined`. My component is `App.js`. Here is the code: [Code]. What is causing this?"               |
| "Explain this."       | "Act as a Computer Science professor. Explain the concept of 'prompt caching' in LLMs using an analogy suitable for a 1st-year engineering student."           |
| "Fix my SQL."         | "Refactor this SQL query to use an index on `user_id`. The table has 1M rows. Explain why this change improves performance."                                   |
| "Write an email."     | "Draft a professional email to my project manager explaining that the API integration will be delayed by 2 days due to an authentication issue."               |
| "Make it better."     | "Improve this technical documentation snippet for clarity and conciseness. Use active voice and ensure it follows Google's developer documentation style."     |
| "Give me data."       | "Generate a CSV-formatted list of 5 common HTTP status codes with their names and a short description of their use cases."                                     |
| "Translate this."     | "Translate the following English technical instructions into professional Gujarati, ensuring that technical terms like 'database' or 'API' remain in English." |
| "Write tests."        | "Write a Jest test suite for the `calculateTotal` function. Include 3 test cases: empty cart, items with taxes, and negative quantities."                      |
| "Summarize."          | "Provide a bulleted summary of this meeting transcript. Highlight action items for the frontend team and mention all deadlines."                               |

---

## Exercise 2: Comparing Prompt Styles

_Task: "Generate a Fibonacci sequence function in Python."_

1. **Direct:** "Write a Python function to generate a Fibonacci sequence."
2. **Persona:** "Act as a Python expert. Write a clean, documented Fibonacci function using recursion."
3. **Chain of Thought:** "Think step-by-step: first identify the base cases for a Fibonacci sequence, then write the logic for the recursive step, then provide the final Python code."
4. **Constraint-based:** "Write a Fibonacci function in Python. Constraint: Do not use recursion. It must be efficient (O(n) time complexity) and include type hints."
5. **Few-Shot:** "Here is a clean Python function for factorials: [Code]. Following that style, write a Fibonacci function."

---

## Exercise 3: Few-Shot Prompting Pattern

_Example for Sentiment Analysis:_

**Prompt:**
I want you to classify the sentiment of these customer reviews as either POSITIVE, NEGATIVE, or NEUTRAL.

Example 1: "The app crashes every time I open it." -> NEGATIVE
Example 2: "The UI is quite intuitive, I like it." -> POSITIVE
Example 3: "It's an okay app, does what it says." -> NEUTRAL

Now classify this: "[Insert your target text here]" ->
