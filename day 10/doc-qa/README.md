# Smart Doc Q&A — "Ask My Notes"

A minimal but functional web app that lets you upload a document (or paste text), ask natural-language questions, and get answers with **page-number citations** and **per-query cost telemetry**.

Built for **Mini-Project 2** of the Groovy Web 30-Day AI-First Engineer Training.

---

## Architecture Overview

```
┌─────────────────┐     POST /api/ask      ┌─────────────────┐     Gemini API
│   React 18      │  ──────────────────▶   │  Express Server  │  ────────────────▶
│   Frontend      │  { question,           │  (backend/)      │  { answer,
│   (frontend/)   │    documentText }       │                   │    citations,
│                 │  ◀──────────────────   │                   │    cost }
│                 │  { answer, citations,  │                   │
│                 │    cost }              │                   │
└─────────────────┘                        └─────────────────┘
```

### Key Design Decisions

| Decision | Choice | Rationale |
| :------- | :----- | :-------- |
| No vector DB | Pure context window | Gemini 2.5 Flash has 1M context — enough for most docs |
| Citation strategy | Inject `[Page X]` markers, instruct model to cite | Simple, effective for MVP |
| Cost calc | Server-side from `usage` fields | Accurate, no client math |
| PDF parsing | Simulated (text paste) for MVP | Real parsing via `pdf-parse` planned |

---

## Project Structure

```
doc-qa/
├── backend/
│   ├── server.js          # Express server + POST /api/ask
│   ├── upload.js          # multer-based file upload
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styling
│   │   └── index.js       # Entry point
│   └── package.json
├── .env.example
└── README.md
```

---

## Setup

### Prerequisites
- **Node.js** v18+
- **npm** or **yarn**
- **Gemini API key** ([aistudio.google.com](https://aistudio.google.com))

### 1. Backend

```bash
cd backend
npm install
# Edit .env — set your GEMINI_API_KEY
npm run dev
```

Server starts on **http://localhost:3001**

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend starts on **http://localhost:3000**

---

## ChromaDB Setup

This backend uses ChromaDB (open-source vector database) for embedding storage and similarity search.

### Start ChromaDB Server

**Windows:**
```bash
cd backend
chroma-start.bat
```

**macOS/Linux:**
```bash
cd backend
chmod +x chroma-start.sh
./chroma-start.sh
```

This installs the Python `chromadb` package and starts the server on `http://localhost:8000`.

### Notes
- ChromaDB runs as a separate process (port 8000). The backend connects to it via the `chromadb` npm package.
- Ensure ChromaDB is running before starting the Node.js backend.
- To reset the vector data, delete (or clear) the ChromaDB collection — the backend's `POST /api/clear` endpoint handles this.

---

## API Reference

### POST /api/ask

**Request:**
```json
{
  "question": "What are the key principles of software craftsmanship?",
  "documentText": "[Page 1, Paragraph 1] The Pragmatic Programmer... [Page 2, Paragraph 1]..."
}
```

**Response:**
```json
{
  "answer": "The key principles include...",
  "citations": [
    { "page": 1, "text": "Excerpt from source..." },
    { "page": 3, "text": "Another excerpt..." }
  ],
  "cost": {
    "promptTokens": 1240,
    "completionTokens": 320,
    "totalCost": 0.0083
  }
}
```

### POST /api/upload

**Request:** `multipart/form-data` with field `file` (`.txt` or `.pdf`)

**Response:**
```json
{
  "text": "Extracted text from the uploaded file...",
  "filename": "my-doc.txt"
}
```

---

## Prompt Documentation

### System Prompt

The system prompt instructs the model to:

1. Answer only from the provided document text
2. Cite page/paragraph numbers for each claim
3. Return structured JSON
4. Decline to answer if the document lacks relevant information

See `day10.md` Section 4 for the full prompt evolution — the JSON format instruction was the single most impactful change.

### Prompt Version History

| Version | Key Change | Citation Accuracy |
| :------ | :--------- | :---------------- |
| v1 | Basic instruction | ~60% |
| v2 | Added `[Page X]` markers | ~75% |
| v3 | Added JSON format | ~90% |
| v4 | Added hallucination guard | ~95% |
| v5 | Production-ready | ~95% |

---

## Future Improvements

- [ ] Real PDF parsing (`pdf-parse` library)
- [ ] Chunking + embedding (chromadb / pgvector)
- [ ] Streaming responses (SSE)
- [ ] Clickable citations (scroll-to-source)
- [ ] Document persistence (save/load history)
- [ ] Confidence scores per citation
