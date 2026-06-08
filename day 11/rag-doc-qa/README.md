# RAG-Powered Doc-Q&A v2

Upgraded from Day 10's "Smart Doc Q&A" — now uses **Retrieval-Augmented Generation (RAG)** with vector embeddings instead of sending the full document with every query.

---

## RAG Architecture

```
                     ┌──────────────────┐
                     │   User uploads   │
                     │   a document     │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ 1. Extract text  │
                     │ 2. Chunk (500c,  │
                     │    50c overlap)  │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ 3. Generate      │
                     │    embeddings    │
                     │ (Google API)     │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ 4. Store in      │
                     │    Vector Store  │
                     │ (JSON file /     │
                     │  ChromaDB)       │
                     └──────────────────┘

                     ┌──────────────────┐
                     │   User asks      │
                     │   a question     │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ 5. Embed the     │
                     │    question      │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ 6. Cosine sim    │
                     │    search → top 3│
                     │    chunks        │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐     ┌──────────────────┐
                     │ 7. Send chunks   │────▶│  Gemini 2.5      │
                     │    + question    │     │  Flash           │
                     │    to LLM        │◀────│  (Google)        │
                     └──────────────────┘     └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │ 8. Return        │
                     │    answer +      │
                     │    citations +   │
                     │    cost          │
                     └──────────────────┘
```

---

## Key Improvements Over Day 10

| Aspect | Day 10 (Full-Doc) | Day 11 (RAG) |
| :----- | :---------------- | :------------ |
| Context sent per query | Entire document (~25K tokens) | Top 3 chunks (~300 tokens) |
| Cost per query | ~$0.077 (Claude 3.5 Sonnet) | ~$0.0001 (Gemini 2.5 Flash) |
| Document size limit | 200K token context window | Unlimited (chunked) |
| Citation source | Page/paragraph markers | Vector similarity score |
| Storage | None (ephemeral) | Persistent vector store |
| Retrieval transparency | None | Shows relevance scores |

---

## Project Structure

```
rag-doc-qa/
├── backend/
│   ├── server.js          # Express + RAG endpoints
│   ├── chunking.js        # Text chunking (fixed-size with overlap)
│   ├── embeddings.js      # Google embedding API + cosine similarity
│   ├── vectorstore.js     # JSON file vector store (ChromaDB-ready)
│   ├── upload.js          # multer file upload
│   ├── package.json
│   └── .env
├── frontend/
│   ├── public/index.html
│   ├── src/
│   │   ├── App.js         # React UI with chunk visualization
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
├── cost_comparison.md     # Full-doc vs RAG cost analysis
└── README.md
```

---

## Setup

### Prerequisites
- **Node.js** v18+
- **Google AI API key** ([aistudio.google.com/apikey](https://aistudio.google.com/apikey))

### 1. Backend

```bash
cd backend
npm install
# Edit .env — set GEMINI_API_KEY
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

## API Reference

### POST /api/upload

Upload a document file (`.txt`, `.md`, `.pdf`).

**Request:** `multipart/form-data` with field `file`

**Response:**
```json
{
  "success": true,
  "filename": "my-doc.txt",
  "totalChars": 25000,
  "totalChunks": 52,
  "chunkSize": 500,
  "chunkOverlap": 50,
  "embeddingCost": {
    "model": "text-embedding-004",
    "totalTokens": 0,
    "totalChars": 25000,
    "cost": 0.00094,
    "pricePerMillionChars": 0.0375
  },
  "stats": {
    "documentCount": 1,
    "chunkCount": 52
  }
}
```

### POST /api/ask

Ask a question against uploaded documents.

**Request:**
```json
{
  "question": "What are the main topics covered?"
}
```

**Response:**
```json
{
  "answer": "The document covers...",
  "citations": [
    { "chunk": 1, "source": "my-doc.txt", "text": "Excerpt..." }
  ],
  "chunks": [
    { "id": "chunk-0", "text": "...", "score": 0.892, "source": "my-doc.txt" },
    { "id": "chunk-12", "text": "...", "score": 0.734, "source": "my-doc.txt" },
    { "id": "chunk-5", "text": "...", "score": 0.612, "source": "my-doc.txt" }
  ],
  "cost": {
    "promptTokens": 450,
    "completionTokens": 200,
    "totalCost": 0.0001,
    "retrievalChunks": 3,
    "totalChunksInStore": 52
  }
}
```

### GET /api/stats

Returns current vector store statistics.

### POST /api/clear

Clears the vector store.

---

## Chunking Strategy

- **Chunk size:** 500 characters (empirically good for semantic coherence)
- **Overlap:** 50 characters (ensures context isn't split mid-sentence)
- **Method:** Fixed-size sliding window
- **Alternative:** Paragraph-based chunking available in `chunking.js`

---

## Vector Store

**Default:** JSON file store (`backend/store/vectors.json`)
- Zero infrastructure
- Persists across restarts
- Cosine similarity search in-memory

**Upgrade path:** ChromaDB (local) or Supabase Vector (hosted)
- Replace `vectorstore.js` methods with ChromaDB client calls
- Better for >1,000 chunks or multi-user scenarios

---

## Cost Comparison

See [`cost_comparison.md`](./cost_comparison.md) for detailed analysis.

| Metric | Full-Doc (Day 10) | RAG (Day 11) |
| :----- | :---------------- | :------------ |
| Cost per query (100KB doc) | ~$0.077 (Claude 3.5 Sonnet) | ~$0.0001 (Gemini 2.5 Flash) |
| Monthly (1K queries, 10 docs) | ~$77.00 | ~$0.11 |
| Savings | — | **~99.9%** |

---

## Future Improvements

- [ ] Real ChromaDB integration
- [ ] PDF text extraction (pdf-parse)
- [ ] Streaming responses (SSE)
- [ ] Multi-document cross-query
- [ ] Hybrid search (keyword + semantic)
- [ ] Reranking with Cohere / cross-encoder
- [ ] Document management UI (list, delete, re-index)
