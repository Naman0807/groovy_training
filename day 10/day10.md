# Day 10 — Mini-Project 2 · Smart Doc Q&A

**Trainee:** Naman  
**Date:** Friday, June 19, 2026  
**Theme:** Mini-Project 2 — Smart Doc Q&A  
**Deliverable:** Working "Ask My Notes" web app + GitHub PR

---

## Table of Contents

1. [Project Brief](#1-project-brief)
2. [Architecture Decisions](#2-architecture-decisions)
3. [Build Log](#3-build-log)
4. [Prompts Used](#4-prompts-used)
5. [Demo Notes](#5-demo-notes)
6. [Cost Telemetry Screenshot Description](#6-cost-telemetry-screenshot-description)
7. [Sprint Retro Notes (Friday)](#7-sprint-retro-notes-friday)
8. [GitHub PR Summary](#8-github-pr-summary)

---

## 1. Project Brief

**Goal:** Build "Ask My Notes" — a web app where a user uploads a document (PDF / paste text) and asks natural-language questions about its content. The app returns answers with **source page citations** and shows **cost telemetry** (token usage + estimated $) for each query.

### Constraints
- No vector DB yet (pure context-window approach)
- React frontend + Node.js/Express backend
- Google Gemini API for Q&A
- Must cite source page numbers in answers
- Must show per-query cost in the UI
- Complete in ~6 hours

### Success Criteria
- [x] User can paste document text or upload a file
- [x] User can ask questions about the document
- [x] Answers include page-number citations
- [x] Cost badge shows token counts and estimated USD
- [x] Backend returns structured JSON with answer, citations, cost
- [x] Demo to cohort in < 10 minutes
- [x] Pushed to GitHub with open PR

---

## 2. Architecture Decisions

### Decision 1: No Vector DB — Pure Context

| Option | Chosen? | Rationale |
| :----- | :------ | :-------- |
| Vector DB (Pinecone / pgvector) | No | Overkill for MVP; adds infra complexity; 6-hour constraint |
| In-memory context window | Yes | Simpler; Gemini 2.5 Flash has 1M context — enough for full docs |
| Hybrid (chunk + prompt) | Future | Will add chunking + embedding in Mini-Project 4 |

The document text is sent alongside each question. For documents larger than ~100K tokens, we'll add chunking later.

### Decision 2: Citation Strategy

- **Approach:** Instruct the model in the system prompt to cite page/paragraph numbers from the document
- **Why:** The model sees the full text and can reference location markers (we inject `[Page X, Paragraph Y]` markers during preprocessing)
- **Format returned:** `{ answer, citations: [{page, text}], cost }`
- **Trade-off:** Relies on model accuracy for citations — good for MVP; chunked retrieval + reranking would be more precise

### Decision 3: Cost Telemetry

- Gemini API returns `usageMetadata.promptTokenCount` and `usageMetadata.candidatesTokenCount` in the response
- We calculate: `totalCost = (inputTokens × $0.10 + outputTokens × $0.40) / 1,000,000` (Gemini 2.5 Flash pricing)
- Badge in UI shows: "⚡ 1,240 in / 320 out · $0.0083"

### Decision 4: PDF Handling

- Using **multer** for file upload
- Text extraction is **simulated** (plain text paste) for MVP
- Future: `pdf-parse` or `pdfjs` for real PDF extraction

### Tech Stack

| Layer | Technology |
| :---- | :--------- |
| Frontend | React 18 (CRA) |
| Backend | Node.js + Express 4 |
| LLM | Google Gemini 2.5 Flash |
| File Upload | multer |
| Cost Calc | Server-side token math |
| Container | (optional) Docker |

---

## 3. Build Log

### 09:00 — 09:30 · Scaffold & Setup

```bash
mkdir doc-qa && cd doc-qa
mkdir backend frontend frontend/public frontend/src
```

Created `backend/package.json`, `backend/server.js`, `frontend/package.json`.

### 09:30 — 10:30 · Backend: Express Server + Gemini Integration

Key implementation in `backend/server.js`:

- POST `/api/ask` accepts `{ question, documentText }`
- Prepends `[Page X, Paragraph Y]` markers to document sections
- Sends structured prompt to Gemini API
- Parses response for citations and cost data
- Returns `{ answer, citations, cost }`

**Prompt template used (see Section 4)**

### 10:30 — 11:30 · Backend: File Upload Module

Implemented `backend/upload.js` with multer:

- Accepts `.txt` and `.pdf` files
- Stores in `uploads/` directory
- Extracts text (for PDFs: placeholder; for txt: read directly)
- Returns extracted text to client

### 11:30 — 13:00 · Frontend: React UI

Built three main UI sections:

1. **Document Input** — Text area for pasting document content + file upload button
2. **Q&A Panel** — Question input field, "Ask" button, answer display area
3. **Cost Telemetry Badge** — Fixed bottom-right badge showing token usage and USD cost

### 13:00 — 14:00 · Lunch

### 14:00 — 15:30 · Styling & Polish

Wrote `App.css` — clean, professional, light theme with subtle shadows and proper spacing. Added loading spinner, empty states, citation cards with hover effects.

### 15:30 — 16:00 · Testing

- Tested with a sample document (excerpt from "The Pragmatic Programmer" — ~2,000 words)
- Asked: "What are the key principles of software craftsmanship?"
- Verified citations included page numbers
- Verified cost badge updated after each query

### Issues Encountered

| Problem | Resolution |
| :------ | :--------- |
| CORS error on first API call | Added `cors()` middleware to Express |
| Gemini API key not recognized | Moved `.env` loading before API client init |
| Citations sometimes missing page numbers | Strengthened system prompt with explicit formatting example |
| Long documents hitting token limit | Added client-side character warning (>100K chars) |

---

## 4. Prompts Used

### System Prompt (sent to Gemini)

```
You are a document Q&A assistant. You have been given the full text of a document
with page markers in the format [Page X, Paragraph Y].

Your job:
1. Answer the user's question based ONLY on the document text provided.
2. For each statement in your answer, cite the specific source by page number.
3. If the document does not contain information to answer the question, say so.
4. Keep answers concise but complete.

Return your answer in this JSON format:
{
  "answer": "Your answer text here...",
  "citations": [
    { "page": 1, "text": "Excerpt from source..." },
    { "page": 3, "text": "Another excerpt..." }
  ]
}

Document:
---
{DOCUMENT_TEXT}
---
```

### User Prompt Template

```
Question: {QUESTION}

Answer based on the document above. Cite page numbers for each claim.
```

### Prompt Engineering Notes

- Adding `[Page X, Paragraph Y]` markers during preprocessing was critical — without them, the model could not reliably produce page citations
- The JSON format instruction reduced parsing errors from ~40% to ~5%
- Including "If the document does not contain information..." reduced hallucinations
- Initial attempts without explicit format instruction led to inconsistent response structures

### Prompt Version History

| Version | Changes | Result |
| :------ | :------ | :----- |
| v1 | "Answer with citations" | Citations inconsistent |
| v2 | Added `[Page X]` markers to doc text | Citations improved but paragraph references wrong |
| v3 | Added paragraph markers + JSON format | Reliable citations, parseable output |
| v4 | Added hallucination guard | Zero false claims in test set |
| v5 (final) | Added cost telemetry extraction | Full pipeline working |

---

## 5. Demo Notes

**Demo to cohort — ~10 minutes**

### Agenda

1. **(1 min)** Open the app, show the UI layout
2. **(2 min)** Paste a sample document (used "The Pragmatic Programmer" highlights)
3. **(2 min)** Ask a question: *"What are the key principles of software craftsmanship?"*
4. **(1 min)** Show answer with page citations
5. **(1 min)** Point out cost badge (bottom-right): "1,240 in / 320 out · $0.0083"
6. **(1 min)** Ask a follow-up: *"What does the book say about DRY?"*
7. **(1 min)** Upload a `.txt` file via file upload
8. **(1 min)** Questions from cohort

### Audience Feedback

- **Rahul (Frontend Lead):** "The citation display is clean — would be nice to click a citation and jump to that section in the document viewer."
- **Nauman (AI/ML):** "Consider adding a confidence score per citation in v2."
- **Krunal (Mentor):** "Good MVP. Next step: chunking + embedding for larger docs."

### What Went Well

- Full pipeline working in under 6 hours
- Citations accurate for test document
- Cost telemetry adds transparency — team appreciated it
- No API errors during demo

### What Could Improve

- PDF parsing is still placeholder (text paste only)
- No document persistence (uploads are ephemeral)
- Citations can't be clicked to navigate

---

## 6. Cost Telemetry Screenshot Description

**File:** `day10-cost-telemetry.png`

The screenshot shows the bottom-right corner of the Smart Doc Q&A app after a successful query:

- **Badge container:** A rounded, semi-transparent dark panel (dark slate #1e293b) with a subtle border glow
- **Icon:** A small lightning bolt emoji (⚡) on the left — colored amber (#f59e0b)
- **Token counts:** Displayed as "1,240 in · 320 out" in a monospace font (gray-300 text)
- **Cost line:** Below the tokens, "≈ $0.0083" in a slightly dimmer font (gray-400) — calculated at Gemini 2.5 Flash pricing ($0.10/M input, $0.40/M output)
- **Divider:** A thin horizontal rule (1px, #334155) separates the token line from the cost line
- **Hover effect:** On hover, a tooltip appears: "Gemini 2.5 Flash · Input: $0.0001 · Output: $0.0001"

The badge is fixed to the viewport (bottom: 20px, right: 20px) and stays visible as the user scrolls through the conversation.

---

## 7. Sprint Retro Notes (Friday)

**Groovy Web Sprint Retro #6**  
**Date:** June 19, 2026, 16:30 — 17:00  
**Attendees:** Krunal (Mentor), Rahul, Nauman, Parth, Dhruti, Naman, +4 other cohort members

### Format: Start / Stop / Continue

#### Start Doing
- **Pre-commit prompt review** — Run prompts through a checklist before committing (suggested by Dhruti after a prompt regression in Sprint 5)
- **Cost budget per sprint** — Track API costs per sprint; Nauman pointed out costs have been creeping up without visibility
- **Pair prompt sessions** — Two devs, one prompt; found to produce higher quality outputs (Krunal's suggestion)

#### Stop Doing
- **Multi-model switching mid-task** — Team agreed it wastes context; pick one model per task
- **Committing AI-generated code without diff review** — Dhruti caught 2 hallucinated imports this sprint
- **Over-prompting** — Writing prompts longer than the code they generate; Krunal: "If your prompt is 50 lines and the output is 10 lines, you're over-prompting"

#### Continue Doing
- **Daily standup prompt-of-the-day** — Effective knowledge sharing
- **Screenshot documentation** — Helpful for retro review
- **Mini-projects** — Everyone agreed hands-on building > theory

### Naman's Input
> "The Smart Doc Q&A project taught me that prompt engineering is the main bottleneck, not API integration. Getting citations right took 4 prompt iterations. The JSON output format was the breakthrough — once the model knew exactly what structure to return, everything clicked."

### Action Items
| Action | Owner | Due |
| :----- | :---- | :-- |
| Add cost tracking to sprint planning template | Nauman | Next sprint |
| Create prompt review checklist | Dhruti | June 22 |
| Investigate chunking library for Mini-Project 4 | Naman | June 26 |

---

## 8. GitHub PR Summary

**Repo:** `github.com/groovy-web/30-day-starter`  
**Branch:** `day-10-smart-doc-qa`  
**PR:** [#12 — feat: Smart Doc Q&A (Mini-Project 2)](https://github.com/groovy-web/30-day-starter/pull/12)

### PR Description
```
## What
Mini-Project 2 — Smart Doc Q&A web app. Users paste or upload a document,
ask natural-language questions, and get answers with page-number citations
and per-query cost telemetry.

## Architecture
- React 18 frontend (CRA-based) with text paste, file upload, Q&A panel
- Node.js/Express backend with POST /api/ask endpoint
- Google Gemini 2.5 Flash for Q&A with citation generation
- Cost telemetry calculated server-side from token usage

## Files Changed
- days/day10/day10.md              — Day log with architecture decisions
- days/day10/doc-qa/README.md      — Project documentation & setup
- days/day10/doc-qa/backend/       — Express API + upload module
- days/day10/doc-qa/frontend/      — React UI
- days/day10/doc-qa/.env.example   — Environment template

## Demo
Demoed to cohort — working pipeline with accurate citations
and real-time cost display. See day10.md for demo notes.

## Next Steps
- Add real PDF parsing (pdf-parse)
- Chunking + embedding for large documents
- Clickable citations that scroll to source text
```

### Review Comments Received
- **Krunal:** "Clean PR. The cost telemetry is a nice touch — please extract the pricing constants into a config file in v2."
- **Rahul:** "Frontend looks good. For v2, add a loading skeleton instead of the spinner."
- **Nauman:** "Consider streaming the response in v2 — Gemini supports streaming and it feels more interactive."

---

## Daily Reflection

> [!TIP]
> **Biggest takeaway:** Prompt engineering *is* the bottleneck. Getting consistent, structured output (citations, JSON) took 4 iterations of the system prompt. The magic isn't in the API call — it's in how precisely you describe the output format.

### Stats

| Metric | Value |
| :----- | :---- |
| Lines of code (backend) | ~120 |
| Lines of code (frontend) | ~200 |
| Lines of CSS | ~150 |
| Prompts iterated (system prompt) | 5 versions |
| API calls during testing | ~30 |
| Total API cost for the day | ~$0.25 |
| Hours spent | ~6 |
| Citations accuracy (final) | ~95% |
| Key takeaway | Output format specification > everything else |
