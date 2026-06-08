# Cost Comparison: Full-Doc vs RAG Approach

> **Assumptions:** 100 KB document (~25,000 tokens), Gemini 2.5 Flash ($0.10/M input, $0.40/M output), text-embedding-004 ($0.0375/M chars). Average query: 50 words input, 150 words output.

---

## One-Time Cost (Ingestion)

| Item | Full-Doc (Day 10) | RAG (Day 11) |
| :--- | :---------------- | :----------- |
| Text extraction | Free | Free |
| Chunking | Not needed | Free (algorithmic) |
| Embedding generation (Google) | — | ~25,000 chars × $0.0375/M = **~$0.00094** |
| Vector storage | — | Free (JSON file) or ~$0/month (ChromaDB local) |
| **Total ingestion** | **$0.00** | **$0.0009 – $0.02** |

---

## Per-Query Cost

| Item | Full-Doc (Day 10) | RAG (Day 11) |
| :--- | :---------------- | :----------- |
| Embed question | — | ~200 chars × $0.0375/M = **~$0.000008** |
| Vector search | — | Free (cosine similarity on ~50 chunks) |
| LLM input (context) | ~25,000 tokens = **$0.075** (Claude 3.5) | ~300 tokens × $0.10/M = **$0.00003** |
| LLM output | ~150 tokens × $15/M = **$0.00225** (Claude 3.5) | ~150 tokens × $0.40/M = **$0.00006** |
| **Total per query** | **~$0.077** | **~$0.0001** |

---

## Monthly Projection (1,000 queries, 10 documents)

| Scenario | Full-Doc (Claude) | RAG (Gemini) | Savings |
| :------- | :---------------- | :----------- | :------ |
| Ingestion (10 docs) | $0.00 | $0.009 | — |
| 1,000 queries | $77.00 | $0.10 | **~$76.90** |
| **Total monthly** | **$77.00** | **$0.11** | **99.9% cheaper** |

---

## Beyond 100 KB

| Document Size | Full-Doc Cost/Query (Claude) | RAG Cost/Query (Gemini) | RAG Advantage |
| :------------ | :--------------------------- | :---------------------- | :------------ |
| 10 KB | $0.008 | $0.00009 | ~99% cheaper |
| 100 KB | $0.077 | $0.00010 | ~99.9% cheaper |
| 500 KB | $0.385 | $0.00015 | ~99.9% cheaper |
| 1 MB (exceeds context) | Not possible | $0.00030 | Unlimited docs |

---

## Non-Financial Comparison

| Factor | Full-Doc (Claude) | RAG (Gemini) |
| :----- | :---------------- | :------------ |
| Context window limit | Hard cap at 200K tokens | Unlimited document size (chunked) |
| Citation accuracy | Relies on model memory | Grounded in retrieved chunks |
| Latency | ~2–4s (large prompt) | ~1–2s (small prompt) |
| Answer quality | Full context, less hallucination | Focused context, may miss cross-references |
| Hallucination risk | Lower (sees everything) | Moderate (may not see relevant chunk) |
| Infrastructure complexity | None (stateless API) | Low (JSON store) to Medium (ChromaDB) |
| Scalability | Linear cost increase | Sub-linear (only top-K chunks processed) |

---

## When to Use Which

### Choose Full-Doc when:
- Documents are <50 KB
- You need the model to reason across the entire document
- Query volume is low (<100/month)
- Latency is not critical

### Choose RAG when:
- Documents are >50 KB or unlimited
- Query volume is high (100+ queries/month)
- You need to scale across many documents
- Cost is a primary concern
- You want to cite specific source chunks

---

## Real-World Numbers (Mock)

```
Document: The Pragmatic Programmer (excerpt, 25K tokens)
                     ┌──────────────────┐     ┌──────────────────┐
                     │  Full-Doc (Claude)│     │  RAG (Gemini)    │
                     │  $0.077/query     │     │  $0.0001/query   │
                     └──────────────────┘     └──────────────────┘
Cost for 100 queries:   $7.70                   $0.01
Cost for 1,000 queries: $77.00                  $0.10
Cost for 10,000 queries:$770.00                 $1.00

Break-even point: RAG pays for itself after ~1 query
(the $0.0009 embedding cost is recovered immediately)
```

---

## Model Pricing Summary

| Provider | Model | Input Price | Output Price |
| :------- | :---- | :---------- | :----------- |
| Anthropic | Claude 3.5 Sonnet | $3.00/M tok | $15.00/M tok |
| Google | Gemini 2.5 Flash | $0.10/M tok | $0.40/M tok |
| Google | text-embedding-004 | $0.0375/M chars | — |

**RAG with Gemini 2.5 Flash is 99.9% cheaper per query than full-doc with Claude 3.5 Sonnet for a 100KB document.** The savings come from two sources: (1) RAG dramatically reduces LLM input tokens, and (2) Gemini 2.5 Flash is 30× cheaper than Claude 3.5 Sonnet.
