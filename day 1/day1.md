# Day 1 — Foundation · "Stop typing. Start prompting."

**Trainee:** Naman  
**Date:** Monday, June 8, 2026  
**Theme:** Stop typing. Start prompting.  
**Deliverable:** Slack intro + screenshot

---

## Table of Contents

1. [Office Tour & Team Intro](#1-office-tour--team-intro)
2. [5 Questions on Slack](#2-5-questions-on-slack)
3. [Installation Log](#3-installation-log)
4. [Account Creation Log](#4-account-creation-log)
5. [API Key Notes](#5-api-key-notes)
6. [GitHub Setup](#6-github-setup)
7. [Hello AI Exercise](#7-hello-ai-exercise)
8. [Slack Intro Post](#8-slack-intro-post)
9. [Screenshot Description](#9-screenshot-description)

---

## 1. Office Tour & Team Intro

### Office Notes

- **Location:** Groovy Web HQ, Ahmedabad — 4th floor, Signet Chambers
- **Layout:** Open floor plan with three "pods" (Frontend, Backend, AI/ML)
- **Standup format:** Daily at 10:00 AM — 3 things (yesterday, today, blockers), kept under 2 min per person
- **Kitchen:** Fully stocked — chai machine is the real MVP
- **Meeting rooms:** Named after Indian rivers (Narmada, Ganga, Yamuna, Godavari)

### Team Members Met

| Name       | Role                        | Notable Quote                                                                     |
| :--------- | :-------------------------- | :-------------------------------------------------------------------------------- |
| **Krunal** | Senior Backend Dev / Mentor | "Your IDE should write 80% of the code. You just guide it."                       |
| **Rahul**  | Frontend Lead               | "If you're typing more than 10 lines without prompting, you're doing it wrong."   |
| **Nauman** | AI/ML Engineer              | "LLMs are like junior devs — they need context, not just instructions."           |
| **Dhruti** | QA Lead                     | "We don't test code anymore. We test prompts."                                    |
| **Parth**  | DevOps                      | "CI/CD now also means Continuous Integration / Continuous Deployment of prompts." |

### Standup Format (observed)

1. Everyone stands in a loose circle near the whiteboard
2. Each person shares: what they shipped yesterday, what they're doing today, any blockers
3. Krunal closes with a "Prompt of the Day" — today's was:  
   _"Generate a FastAPI health-check endpoint with rate limiting and structured logging"_

---

## 2. 5 Questions on Slack

After reading `CLAUDE.md` and `PLAYBOOK.md`, I posted these questions in `#ai-first-engineer`:

> **Naman** — `#ai-first-engineer` — 10:47 AM
>
> 1. In CLAUDE.md, it says "always prefer prompting over typing." Does this include boilerplate config files (Dockerfile, CI yaml), or is there a line where manual edits are still preferred?
> 2. PLAYBOOK.md mentions "context seeding" by adding files to `@docs` in Cursor/Continue. When working in a monorepo with 5+ packages, should I seed ALL package READMEs or just the one I'm actively modifying?
> 3. For the "Hello AI" exercise, should the prompt be purely free-form, or are we expected to follow the template from PLAYBOOK.md Section 2.1?
> 4. Are we expected to use AI for git commit messages as well? (i.e., prompt → generate → copy-paste, or do we manually write them?)
> 5. When evaluting model outputs in our daily log, what's the minimum criteria we should note? Just accuracy, or also verbosity and hallucination risk?

**Replies received:**

> **Krunal** — 11:03 AM
> Great questions. Quick answers:
>
> 1. Yes — even boilerplate. Prompt it, then manually verify. The goal is speed + accuracy.
> 2. Seed only what's in scope. Use `@file` for specific references, not entire directories.
> 3. Free-form is fine. The template is a suggestion, not a rule.
> 4. Yes — AI writes the message, you review it. Speed matters.
> 5. Note verbosity + hallucination risk alongside accuracy. That's what we do in sprint retros.

---

## 3. Installation Log

### VS Code

| Item                     | Detail                                                                          |
| :----------------------- | :------------------------------------------------------------------------------ |
| **Version**              | 1.91.0 (Universal)                                                              |
| **Download**             | [code.visualstudio.com](https://code.visualstudio.com)                          |
| **Extensions installed** | Continue.dev v0.8.5, Codeium v1.10.6, ESLint, Prettier, GitLens, Thunder Client |
| **Time taken**           | ~12 min                                                                         |

### Continue.dev (AI IDE Extension)

```bash
# Installed via VS Code Extensions panel (Search: "Continue")
# Config file will be set up tomorrow — using default for now
```

- **Version:** 0.8.5
- **Model configured:** gemini-2.5-flash-lite (via Google Gemini API — see Section 5)
- **Note:** Initial connection test passed ✓

### Codeium (Tab Autocomplete)

```bash
# Installed via VS Code Extensions panel
```

- **Version:** 1.10.6
- **Status:** Active — completions working in JavaScript, Python, and TypeScript
- **Issue:** Initially didn't activate in `.md` files — re-enabled via settings → fixed

### Issues Encountered

| Problem                                    | Resolution                                        |
| :----------------------------------------- | :------------------------------------------------ |
| Codeium not completing in markdown files   | Toggled "Enable in Markdown" in Codeium settings  |
| Continue.dev required API key on first use | Generated Gemini API key (see Section 5)          |
| VS Code Git integration asked for auth     | Used GitHub personal access token (see Section 6) |

---

## 4. Account Creation Log

| Service              | Email Used                    | Username       | Status              |
| :------------------- | :---------------------------- | :------------- | :------------------ |
| **Google AI Studio** | `naman.trainee@groovyweb.dev` | `naman.groovy` | ✓ account created ✓ |
| **ChatGPT**          | `naman.trainee@groovyweb.dev` | `naman.groovy` | ✓ account created ✓ |
| **Gemini**           | `naman.trainee@groovyweb.dev` | `naman.groovy` | ✓ account created ✓ |

> [!NOTE]
> All accounts created with the company email alias. Free tier for chat interfaces; API keys are for IDE integration (Continue.dev) and direct API testing.

---

## 5. Gemini API Key

- **Console URL:** [aistudio.google.com](https://aistudio.google.com)
- **Free tier:** 60 requests per minute, 1M token context
- **Key:** `AIzaSy...`
- **Variable:** `GEMINI_API_KEY`

> [!WARNING]
> Never commit API keys to Git. The `.gitignore` in the repo root already excludes `.env` and `*.local` files. If a key leaks, revoke it immediately from the provider's console.

---

## 6. GitHub Setup

### Git Configuration

```bash
git config --global user.name "Naman"
git config --global user.email "naman.trainee@groovyweb.dev"
git config --global init.defaultBranch main
git config --global pull.rebase true
```

### GitHub Account

- **Username:** `naman-groovy`
- **SSH Key:** Generated and added to GitHub settings

```bash
ssh-keygen -t ed25519 -C "naman.trainee@groovyweb.dev"
# Public key added to github.com/settings/keys
```

### Clone First Repo

```bash
# From senior (Krunal): starter repo for the 30-day program
git clone git@github.com:groovy-web/30-day-starter.git
cd 30-day-starter
git log --oneline -5
```

```
2a4b1e7 Initial commit: project scaffold
f8e2c9d Add .gitignore and README
3b6d1f0 Set up ESLint + Prettier config
9a1c2b8 Add Docker compose for local dev
e7d3f5a Configure GitHub Actions CI
```

---

## 7. Hello AI Exercise

### First Prompt Ever

I typed this into Continue.dev (gemini-2.5-flash-lite model):

```text
@README.md You are a senior AI engineer onboarding a new team member.
Write a "Hello AI" script in Python that:
1. Queries the current weather using the LLM's own training knowledge
2. Greets the user by the name passed as a CLI argument
3. Explains in one sentence what "AI-First Engineering" means
Make the output colorful and fun.
```

### AI Response

```python
#!/usr/bin/env python3
"""Hello AI — your first prompt-powered script."""

import argparse
import random
from datetime import datetime

WEATHER = {
    "Ahmedabad": {"temp": 38, "condition": "Sunny — it's hot, drink water"},
    "Mumbai": {"temp": 32, "condition": "Humid with a chance of chai"},
    "Bengaluru": {"temp": 24, "condition": "Pleasant — AI weather is always right"},
    "default": {"temp": 28, "condition": "Clear skies for clean code"},
}

GREETINGS = [
    "Hey {name}! The LLMs are online and ready to pair.",
    "Good morning, {name}. You've entered the prompt-driven zone.",
    "Welcome {name}. Stop typing. Start prompting.",
]


def main():
    parser = argparse.ArgumentParser(description="Hello AI — your first prompt-powered script.")
    parser.add_argument("--name", default="Trainee", help="Your name")
    parser.add_argument("--city", default="Ahmedabad", help="Your city")
    args = parser.parse_args()

    city = args.city if args.city in WEATHER else "default"
    weather = WEATHER[city]
    greeting = random.choice(GREETINGS).format(name=args.name)

    print("\n" + "=" * 50)
    print(f"  🤖 HELLO AI — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 50)
    print(f"  {greeting}")
    print(f"  🌤  Weather in {args.city}: {weather['temp']}°C — {weather['condition']}")
    print(f"  🧠 AI-First Engineering: Writing prompts that generate, test, and deploy")
    print(f"      production code — so engineers focus on architecture, not syntax.")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    main()
```

### Execution Output

```bash
$ python hello_ai.py --name Naman --city Ahmedabad

==================================================
  🤖 HELLO AI — 2026-06-08 14:32
==================================================
  Hey Naman! The LLMs are online and ready to pair.
  🌤  Weather in Ahmedabad: 38°C — Sunny, it's hot, drink water
  🧠 AI-First Engineering: Writing prompts that generate, test, and deploy
      production code — so engineers focus on architecture, not syntax.
==================================================
```

### Thoughts After First Prompt

- **Time spent:** Prompt took ~2 min to write, AI generated the code in ~8 seconds
- **Quality:** The code was runnable on first try — no syntax errors, handled edge cases (unknown city names)
- **Vibe shift:** This is genuinely faster than writing the same script by hand. I can see how the workflow changes from "write every line" to "describe the goal, review the output, ship."

---

## 8. Slack Intro Post

> **Naman** — `#introductions` — 3:15 PM
>
> Hey everyone! 👋
>
> I'm **Naman**, joining the 30-day AI-First Engineer cohort. I just finished Day 1 and here's my screenshot from the "Hello AI" exercise — a Python script I generated entirely through Continue.dev + Gemini with zero manual typing.
>
> **1 surprise from today:** I expected AI tools to be _helpers_ — autocomplete on steroids. What I didn't expect was how much the _skill of prompting_ already feels like a real engineering craft. Writing a good prompt today took more thought than writing the code itself ever did. The bottleneck is no longer "can I type this function" but "can I describe this problem precisely enough for an LLM to solve it." That's a totally different muscle, and I can already tell it's going to be the most important one I build this month.
>
> Looking forward to shipping with all of you. 🚀
>
> _(screenshot attached)_

---

## 9. Screenshot Description

The screenshot (saved as `day1-hello-ai.png`) shows:

- **Left panel:** VS Code with the `hello_ai.py` file open, the prompt visible in the Continue.dev side panel at the top, and the generated code below
- **Right panel (inset):** Terminal window showing the script output — colorful ASCII box with the AI greeting, weather data, and the "Stop typing. Start prompting." tagline
- **Bottom-right corner:** A small window showing the Slack `#introductions` channel with the post partially visible
- **VS Code status bar:** Shows "Continue: gemini-2.5-flash-lite" active — confirming the IDE-AI connection is live

---

## Daily Reflection

> [!TIP]
> **Biggest takeaway:** The prompt _is_ the code. The faster I get at writing precise, contextual prompts, the faster I'll ship. Today was about unlearning the habit of reaching for the keyboard first and instead reaching for the prompt bar.

### Stats

| Metric                         | Value                     |
| :----------------------------- | :------------------------ |
| Lines of code written manually | 0                         |
| Lines of code generated by AI  | ~50                       |
| Prompts written                | 3                         |
| Models tested                  | 1 (gemini-2.5-flash-lite) |
| Accounts created               | 5                         |
| Questions asked on Slack       | 5                         |
| Key takeaway                   | Prompts > Keystrokes      |

---
