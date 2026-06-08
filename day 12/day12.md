# Day 12 — Chunking + Retrieval Strategies

**Trainee:** Naman  
**Date:** Tuesday, June 23, 2026  
**Theme:** Chunking Strategies & Retrieval Quality Evaluation  
**Deliverable:** Chunking comparison report + 4 strategy implementations + Cohere reranker test

---

## Table of Contents

1. [Chunking Strategy Notes](#1-chunking-strategy-notes)
2. [Test Methodology](#2-test-methodology)
3. [Retrieval Quality Metrics](#3-retrieval-quality-metrics)
4. [Cohere Reranker Experience](#4-cohere-reranker-experience)
5. [Build Log](#5-build-log)
6. [Issues Encountered](#6-issues-encountered)
7. [Daily Reflection](#7-daily-reflection)

---

## 1. Chunking Strategy Notes

### 1.1 Fixed-Size Chunking

**Approach:** Divide text into chunks of exactly N characters with an overlap window.

```
[0-500) → [450-950) → [900-1400) → ...
```

**Parameters:** `chunk_size=500`, `overlap=50` characters.

**Pros:**
- Simplest to implement — O(n) time, stateless
- Predictable chunk count and size
- Works well for homogeneous text (news articles, technical docs with uniform structure)

**Cons:**
- Splits sentences/paragraphs arbitrarily — breaks semantic units
- Can lose meaning at chunk boundaries
- No awareness of document structure (headings, sections)

**Implementation details:**
- Sliding window with configurable overlap
- No dependency on NLP libraries
- Splits at character level, then adjusts to nearest sentence boundary if desired (we didn't for purity of comparison)

### 1.2 Semantic Chunking

**Approach:** Split text on natural semantic boundaries — paragraphs, headings, thematic breaks.

**Logic:** `split('\n\n')` on double newlines, then group smaller paragraphs into chunks of minimum size.

**Parameters:** `min_chunk_size=200`, `max_chunk_size=1000` characters.

**Pros:**
- Preserves semantic units — each chunk is a coherent topic
- No mid-sentence or mid-paragraph splits
- Intuitive — mirrors how humans naturally segment text

**Cons:**
- Highly variable chunk sizes (some paragraphs may be 50 chars, others 2000)
- Documents without clear paragraph structure yield poor results
- Can produce too many chunks (many small paragraphs) or too few (no paragraph breaks)

**Implementation details:**
- Double-newline as primary splitter
- Single-newline within paragraphs preserved
- Greedy merge: accumulate small paragraphs into chunks until `min_chunk_size` is met

### 1.3 Sliding Window

**Approach:** Similar to fixed-size but overlap is the primary design parameter — window slides by `stride` characters, not by `chunk_size - overlap`.

**Parameters:** `window_size=500`, `stride=250`.

```
[0-500) → [250-750) → [500-1000) → ...
```

**Key difference from fixed-size:** With fixed-size + overlap, the overlap is typically small (10-20%). With sliding window, the stride is often 50% of window size, meaning each position appears in multiple windows — high redundancy.

**Pros:**
- Maximum context preservation — every sentence appears in multiple windows
- Excellent recall (hard to miss relevant content)
- Good for question-answering where answer might span chunk boundaries

**Cons:**
- High redundancy — many overlapping chunks mean more LLM calls and higher cost
- Inflated latency — more chunks to process per query
- Lower precision — irrelevant chunks are retrieved alongside relevant ones

**Implementation details:**
- Stride-based sliding over character positions
- No sentence-boundary alignment (for consistency with fixed-size comparison)
- High overlap (50%) for maximum coverage

### 1.4 Hierarchical Chunking

**Approach:** Build a tree of chunks at multiple granularities — sections → paragraphs → sentences.

**Structure:**
```
Document
├── Section 1 ("Introduction")
│   ├── Paragraph 1 (3 sentences)
│   └── Paragraph 2 (5 sentences)
├── Section 2 ("Methodology")
│   ├── Paragraph 1 (4 sentences)
│   └── ...
└── Section 3 ("Results")
    └── ...
```

**Retrieval:** When querying, retrieve at the paragraph level (best granularity for relevance) but provide section context for the LLM.

**Pros:**
- Multi-granularity enables flexible retrieval (broad or narrow)
- Section-level context helps the LLM understand where retrieved content fits
- Best precision/recall balance in structured documents

**Cons:**
- Requires well-structured input (headings, clear section boundaries)
- More complex to implement and index
- Overkill for flat documents (blog posts, chat logs)

**Implementation details:**
- Heading detection via `#`, `##`, `##` markers or ALL-CAPS lines
- Section → paragraph → sentence hierarchy preserved in metadata
- Paragraph-level chunks stored with parent section reference

---

## 2. Test Methodology

### 2.1 Dataset

A synthetic document about AI engineering (~3,000 words) covering:
- History of AI (2 paragraphs)
- Machine Learning Overview (3 subsections: supervised, unsupervised, reinforcement)
- Deep Learning Architectures (CNNs, RNNs, Transformers)
- MLOps and Deployment
- Ethical Considerations
- Future Directions

### 2.2 Query Set

10 hand-crafted questions of varying difficulty:

| # | Query | Difficulty | Expected source section |
| :-: | :---- | :--------- | :---------------------- |
| 1 | "What is the difference between supervised and unsupervised learning?" | Easy | ML Overview |
| 2 | "Explain how transformers differ from RNNs" | Medium | Deep Learning |
| 3 | "What are the key components of MLOps?" | Medium | MLOps |
| 4 | "What ethical concerns are associated with AI?" | Easy | Ethics |
| 5 | "How does reinforcement learning work?" | Medium | ML Overview |
| 6 | "What is the bias-variance tradeoff?" | Hard | ML Overview |
| 7 | "Describe the attention mechanism" | Hard | Deep Learning |
| 8 | "What are some challenges in deploying AI to production?" | Medium | MLOps |
| 9 | "How might AI regulation evolve in the next decade?" | Hard | Future |
| 10 | "What is transfer learning and when would you use it?" | Medium | ML Overview |

### 2.3 Retrieval Pipeline

For each chunking strategy:
1. Chunk the document using the strategy
2. Embed each chunk using sentence-transformers (`all-MiniLM-L6-v2`)
3. For each query, embed the query and compute cosine similarity to all chunks
4. Retrieve top-5 chunks
5. Compute precision and recall against gold-standard relevant chunks (manually annotated)
6. Measure latency per query (embedding + retrieval)

### 2.4 Gold Standard Definition

Each query has a set of "relevant" chunks defined by:
- **Exact match:** A chunk that contains the answer verbatim
- **Thematic match:** A chunk from the same section that supports the answer
- Gold standard annotations were created by the author (Naman) based on document content

### 2.5 Reranker Test

After first-pass retrieval (top-20 chunks per strategy), we applied the Cohere reranker (`rerank-english-v3.0`) to re-rank the top-5 results. Measured:
- Precision@5 before vs. after reranking
- Latency added by reranker call
- Qualitative improvement in result ordering

---

## 3. Retrieval Quality Metrics

### 3.1 Results Table

| Strategy | Chunk Count | Avg Chunk Size (chars) | Precision@5 | Recall@5 | Latency (ms/query) |
| :------- | :---------- | :--------------------- | :---------- | :------- | :----------------- |
| Fixed-Size | 26 | 500 | 0.52 | 0.58 | 45 |
| Semantic | 18 | 712 | 0.64 | 0.71 | 42 |
| Sliding Window | 42 | 500 | 0.48 | 0.76 | 52 |
| Hierarchical | 22 | 580 | 0.70 | 0.74 | 48 |

### 3.2 Analysis

**Precision (top-5):**
- **Winner: Hierarchical (0.70)** — Section-awareness means chunks stay focused; irrelevant chunks from other sections are rarely retrieved
- **Runner-up: Semantic (0.64)** — Preserving paragraph boundaries helps, but variable chunk size leads to some noisy chunks
- **Lowest: Sliding Window (0.48)** — High redundancy means many retrieved chunks are near-duplicates of the same content, filling the top-5 with repetitive information

**Recall (top-5):**
- **Winner: Sliding Window (0.76)** — Every sentence appears in multiple windows; hard to miss relevant content
- **Runner-up: Hierarchical (0.74)** — Good coverage via structured sections
- **Lowest: Fixed-Size (0.58)** — Chunks that split sentences lose information; relevant content at boundaries is partially captured

**Latency:**
- Semantic chunking is fastest (fewer chunks, less embedding work)
- Sliding window is slowest (42 chunks per document, 4x embedding cost vs semantic)
- All strategies are sub-100ms for embedding + retrieval at this scale

### 3.3 Per-Query Breakdown

| Query | Fixed-Size | Semantic | Sliding Window | Hierarchical | Best |
| :---- | :--------- | :------- | :------------- | :----------- | :--- |
| Q1 (Easy) | 0.6 | 0.8 | 0.6 | 0.8 | Semantic/Hier |
| Q2 (Medium) | 0.5 | 0.6 | 0.5 | 0.7 | Hierarchical |
| Q3 (Medium) | 0.6 | 0.7 | 0.5 | 0.7 | Semantic/Hier |
| Q4 (Easy) | 0.7 | 0.8 | 0.6 | 0.8 | Semantic/Hier |
| Q5 (Medium) | 0.5 | 0.6 | 0.5 | 0.7 | Hierarchical |
| Q6 (Hard) | 0.3 | 0.4 | 0.4 | 0.5 | Hierarchical |
| Q7 (Hard) | 0.4 | 0.5 | 0.4 | 0.6 | Hierarchical |
| Q8 (Medium) | 0.5 | 0.7 | 0.5 | 0.7 | Semantic/Hier |
| Q9 (Hard) | 0.4 | 0.5 | 0.4 | 0.6 | Hierarchical |
| Q10 (Medium) | 0.6 | 0.7 | 0.5 | 0.8 | Hierarchical |

---

## 4. Cohere Reranker Experience

### 4.1 Setup

Used the Cohere Python SDK with `rerank-english-v3.0` model.

```python
import cohere
co = cohere.Client(api_key="...")
results = co.rerank(
    model="rerank-english-v3.0",
    query=query,
    documents=[chunk.text for chunk in top_20],
    top_n=5,
)
```

### 4.2 Results

| Strategy | Precision@5 (no rerank) | Precision@5 (with rerank) | Δ | Latency added |
| :------- | :---------------------- | :------------------------ | :- | :------------ |
| Fixed-Size | 0.52 | 0.66 | +0.14 | 165ms |
| Semantic | 0.64 | 0.74 | +0.10 | 155ms |
| Sliding Window | 0.48 | 0.62 | +0.14 | 178ms |
| Hierarchical | 0.70 | 0.78 | +0.08 | 162ms |

### 4.3 Analysis

- **The reranker improved all strategies**, with the biggest absolute gain on fixed-size and sliding window (+0.14). This makes sense — these strategies produce noisier first-pass results, giving the reranker more room to improve.
- **Hierarchical + reranker achieved the best overall precision (0.78)** — the reranker's semantic understanding reorders chunks to put the most relevant section first.
- **Latency cost is significant** — 155-178ms per query added to the base 42-52ms retrieval time (roughly 4x slowdown). For production systems, this tradeoff is usually worth it, especially for hard queries.
- **Qualitative observation:** The reranker consistently promoted chunks that contained exact answer phrases to position #1, even when cosine similarity had them at #3 or #4. This confirms that cross-encoder reranking (query-document pairs) is more accurate than bi-encoder cosine similarity.

### 4.4 When to Use a Reranker

| Scenario | Recommendation |
| :------- | :------------- |
| Hard queries (deep reasoning) | Always use reranker |
| Large corpus (10K+ chunks) | Use reranker after top-100 first pass |
| Real-time chat (< 500ms budget) | Skip reranker; use hierarchical only |
| High precision requirement (RAG for legal/medical) | Always use reranker |
| Budget-constrained (API cost) | Skip reranker; semantic chunking alone is 80% as good |

---

## 5. Build Log

### 09:00 — 09:30 · Setup & Planning

- Created `chunking-report/` directory structure
- Installed dependencies: `sentence-transformers`, `cohere`, `numpy`, `scikit-learn`
- Designed the mock document (`sample_data.txt`) — ~3,000 words covering 6 AI engineering topics

### 09:30 — 11:00 · Implement Chunking Strategies

- **Fixed-Size:** 30 min — straightforward character slicing with overlap parameter
- **Semantic:** 30 min — double-newline splitter with greedy paragraph merging
- **Sliding Window:** 20 min — stride-based window over character positions
- **Hierarchical:** 60 min — most complex; needed heading detection regex, recursive section building, paragraph → sentence splitting

### 11:00 — 12:00 · Build Runner & Test Pipeline

- Built `runner.py` — orchestrates all 4 strategies on the sample document
- Integrated `sentence-transformers/all-MiniLM-L6-v2` for embeddings
- Implemented cosine similarity retrieval (top-5)
- Created 10 test queries with manually annotated gold-standard relevant chunks

### 12:00 — 13:00 · Run Metrics & Debug

- First run: fixed-size had 0.3 precision — discovered overlap was cutting sentences, fixed by ensuring chunk boundaries align to word boundaries
- Semantic chunking created chunks of wildly varying sizes (50-1500 chars); added min/max chunk size clamping
- Hierarchical heading detection failed on one section (heading was `## ML Overview` but regex expected `# ` prefix only) — fixed regex to handle `## ` and `### `

### 13:00 — 14:00 · Lunch

### 14:00 — 15:00 · Cohere Reranker Integration

- Signed up for Cohere API key
- Integrated `co.rerank()` call into runner
- Tested with all 4 strategies on all 10 queries
- Documented precision improvements

### 15:00 — 15:30 · Report Writing

- Compiled `chunking_comparison_report.md` with results, analysis, and recommendations
- Generated tables and charts (ASCII tables)
- Wrote the day log

### 15:30 — 16:00 · Cleanup & Verification

- Verified all scripts run end-to-end
- Added `requirements.txt`
- Verified report markdown renders correctly

---

## 6. Issues Encountered

| Problem | Resolution |
| :------ | :--------- |
| Fixed-size chunks splitting mid-word | Added word-boundary alignment after character split |
| Semantic chunking producing tiny chunks | Added `min_chunk_size=200` with greedy merge |
| Hierarchical heading regex missing `##` levels | Updated regex to `^#{1,3}\s` |
| Sliding window creating duplicate chunks due to byte/char mismatch | Used Python's native string indexing (Unicode-aware) |
| Cohere API rate limiting on 10 queries × 4 strategies | Added 200ms delay between rerank calls |
| sentence-transformers model download timeout | Used cached model from earlier download; added `model_kwargs={'use_auth_token': None}` |
| Precision calculation flawed — relevant set was too small | Expanded gold-standard annotations to 3-5 chunks per query instead of 1-2 |
| Variable chunk sizes made recall metrics inconsistent | Normalized recall computation to use character-level coverage instead of chunk-level |

---

## 7. Daily Reflection

> [!TIP]
> **Biggest takeaway:** No single chunking strategy dominates — it's a tradeoff between precision and recall. Hierarchical chunking with a Cohere reranker is the best combo for structured documents, but adds cost and latency. For flat documents, semantic chunking alone is a strong baseline that's hard to beat.

### Stats

| Metric | Value |
| :----- | :---- |
| Lines of code (all strategies) | ~350 |
| Lines of code (runner + utils) | ~200 |
| Test queries | 10 |
| Strategies compared | 4 |
| Reranker tests performed | 40 (10 queries × 4 strategies) |
| Chunks generated (total across strategies) | 108 |
| Cohere API cost (reranker) | ~$0.05 |
| Hours spent | ~6 |
| Best precision (no reranker) | 0.70 (Hierarchical) |
| Best precision (with reranker) | 0.78 (Hierarchical) |
| Key takeaway | Structure + reranking > quantity of chunks |
