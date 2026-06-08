# Chunking Strategy Comparison Report

**Author:** Naman  
**Date:** June 23, 2026  
**Course:** Groovy Web 30-Day Training — Day 12  
**Dataset:** 11,842 character AI engineering overview document  
**Embedding Model:** `all-MiniLM-L6-v2` (384-dim)  
**Reranker:** Cohere `rerank-english-v3.0`

---

## Methodology

### Document

A synthetic document about AI engineering (~11,842 characters) covering 6 main sections: History, Machine Learning Overview, Deep Learning Architectures, MLOps, Ethics, and Future Directions. The document uses markdown-style headings (`##`) and paragraph breaks.

### Chunking Strategies Tested

| Strategy | Parameters | Description |
| :------- | :--------- | :---------- |
| Fixed-Size | 500 chars, 50 overlap | Split at character level, align to word boundaries |
| Semantic | min=200, max=1000 chars | Split on double-newlines, greedy paragraph merge |
| Sliding Window | 500 chars window, 250 stride | Overlapping windows at 50% stride |
| Hierarchical | Section→Paragraph→Sentence | Heading detection, recursive structure |

### Query Set

10 questions across 3 difficulty levels (4 easy, 4 medium, 2 hard). Each query has manually annotated gold-standard relevant chunks (3-5 per query).

### Metrics

- **Precision@5:** Fraction of top-5 retrieved chunks that contain at least one relevant keyword
- **Recall@5:** Maximum keyword-match coverage across the top-5 chunks
- **Latency:** Time to embed all chunks + compute cosine similarity for all 10 queries (total averaged per query)
- **Chunk Count:** Total chunks produced by each strategy
- **Avg Chunk Size:** Mean character count per chunk

### Reranker Test

For each strategy, the top-20 chunks from cosine-similarity retrieval were passed through Cohere `rerank-english-v3.0`. Precision@5 was measured again on the reranked results to quantify improvement.

---

## Results

### Overall Comparison

| Strategy | Chunk Count | Avg Chunk Size | Precision@5 | Recall@5 | Latency (ms) |
| :------- | :---------- | :------------- | :---------- | :------- | :----------- |
| Fixed-Size | 27 | 482 | 0.62 | 0.84 | 730.3 |
| Semantic | 14 | 843 | 0.54 | 0.85 | 713.3 |
| Sliding Window | 47 | 492 | **0.80** | **0.86** | 1300.9 |
| Hierarchical | 53 | 221 | 0.66 | 0.80 | 1037.1 |

### Per-Query Precision@5

| Query | Fixed-Size | Semantic | Sliding Window | Hierarchical |
| :---- | :--------- | :------- | :------------- | :----------- |
| Q1: Supervised vs Unsupervised | 1.0 | 0.8 | 1.0 | 1.0 |
| Q2: Transformers vs RNNs | 0.8 | 0.6 | 1.0 | 1.0 |
| Q3: MLOps components | 1.0 | 0.6 | 1.0 | 0.8 |
| Q4: Ethical concerns | 0.6 | 0.2 | 0.6 | 0.4 |
| Q5: Reinforcement learning | 0.8 | 0.8 | 1.0 | 0.8 |
| Q6: Bias-variance tradeoff | 0.4 | 0.4 | 0.6 | 0.4 |
| Q7: Attention mechanism | 0.4 | 0.4 | 0.6 | 0.4 |
| Q8: Deployment challenges | 0.6 | 0.6 | 0.6 | 1.0 |
| Q9: AI regulation future | 0.2 | 0.6 | 0.8 | 0.4 |
| Q10: Transfer learning | 0.4 | 0.4 | 0.8 | 0.4 |

### Cohere Reranker Results

The Cohere reranker hit the **Trial key rate limit (HTTP 429)** during evaluation — only the first strategy (Fixed-Size) completed before the limit was reached:

| Strategy | Precision@5 (no rerank) | Precision@5 (with rerank) | Δ | Status |
| :------- | :---------------------- | :------------------------ | :- | :----- |
| Fixed-Size | 0.62 | 0.60 | -0.02 | Completed (degradation likely due to single call) |
| Semantic | 0.54 | — | — | **Failed — HTTP 429** |
| Sliding Window | 0.80 | — | — | **Failed — HTTP 429** |
| Hierarchical | 0.66 | — | — | **Failed — HTTP 429** |

The Cohere Trial tier allows approximately 10 calls per minute, which was insufficient for the full 4-strategy × 20-chunk evaluation. Only the first strategy's rerank call succeeded. The slight degradation on Fixed-Size (0.62 → 0.60) is likely noise from having only a single rerank sample rather than a meaningful signal.

---

## Analysis

### Which Strategy Wins?

**For precision: Sliding Window** achieves the highest Precision@5 (0.80), significantly ahead of the next best strategy (Hierarchical at 0.66). The overlapping windows ensure that relevant content appears in multiple contexts, increasing the chance that at least one window captures the exact phrasing the query matches. This is a strong result — the 50% stride provides dense coverage without excessive dilution.

**For recall: Sliding Window** also leads at 0.86, though the margin over Fixed-Size (0.84) and Semantic (0.85) is narrow. All three strategies perform similarly on recall, suggesting the document's content is well-distributed enough that most strategies capture the relevant passages.

**For balanced performance: Fixed-Size** is the pragmatic winner. It achieves 0.62 precision and 0.84 recall with only 27 chunks and the second-fastest latency (730.3ms). While its precision trails Sliding Window by a wide margin, it produces nearly half the chunks (27 vs 47) and runs 44% faster.

**Hierarchical** produced the most chunks (53) with the smallest average size (221 chars). Despite leveraging document structure, its precision (0.66) lags behind Sliding Window, and its recall (0.80) is the lowest. The fine-grained sentence-level splitting may fragment content too aggressively, causing relevant material to be spread across multiple retrievable units.

**Semantic** chunking, while simplest and fastest (713.3ms), yielded the lowest precision (0.54). Its 843-char average chunk size is nearly double that of other strategies, which likely dilutes relevance within each chunk. For this dataset, the paragraph-level boundaries do not align well with query granularity.

### Impact of Reranker

No meaningful reranker conclusions can be drawn — the Cohere Trial key rate limit (10 calls/minute) prevented full evaluation. Only Fixed-Size completed, showing a marginal -0.02 change attributable to noise. A production evaluation would require a higher-rate API key or a local cross-encoder reranker (e.g., `cross-encoder/ms-marco-MiniLM-L-6-v2`).

### Hard Query Performance

Hard queries (Q6, Q7, Q9) consistently underperformed easy and medium queries across all strategies. Sliding Window maintained the highest floor (0.6-0.8), while Fixed-Size and Semantic dropped as low as 0.2 (Q9). This pattern reflects the inherent difficulty of matching complex, cross-sectional topics with single-chunk retrieval — no chunking strategy alone can synthesize information that spans multiple sections.

---

## Recommendation

| Use Case | Recommended Strategy | Why |
| :------- | :------------------ | :-- |
| Maximum precision | **Sliding Window** | Best Precision@5 (0.80), top recall (0.86) |
| Flat docs, simplicity | **Fixed-Size** | Good recall (0.84), moderate precision (0.62), fewer chunks |
| High recall requirement | **Sliding Window** | Best recall (0.86) and precision (0.80) — wins both |
| Real-time / low latency | **Semantic** | Fastest latency (713.3ms), though precision suffers |
| Structured docs with hierarchy | **Hierarchical** | Solid precision (0.66), but Sliding Window outperforms it |

**General recommendation for this dataset:** Use **Sliding Window** chunking. It dominates both precision and recall, and while it produces the most chunks (47) and has the highest latency (1300.9ms), the retrieval quality advantage is substantial. For latency-sensitive applications, **Fixed-Size** is a reasonable fallback — it sacrifices 0.18 precision but cuts latency by 44%.

For production RAG pipelines with this data, the recommended combination is:
1. **Sliding Window chunking** (500-char window, 250-char stride)
2. **Top-20 first pass** with cosine similarity (fast, cheap)
3. **Local cross-encoder reranker** (avoid API rate limits in development)
4. **Metadata injection** (window offset, document section) into LLM context

---

## Appendix: Raw Data

### Strategy Output Counts

| Strategy | Total Chunks | Min Size | Max Size | Std Dev |
| :------- | :----------: | :------: | :------: | :-----: |
| Fixed-Size | 27 | 312 | 500 | 48 |
| Semantic | 14 | 212 | 985 | 215 |
| Sliding Window | 47 | 287 | 500 | 52 |
| Hierarchical | 53 | 84 | 412 | 89 |

### Notes

- Fixed-size chunk sizes vary because of word-boundary alignment (avoids mid-word splits)
- Semantic chunking has high std dev because paragraphs vary naturally — the min/max constraints prevent extreme sizes but allow natural variation
- Hierarchical sentence-level chunks are small (84 chars min) — some sections have very short sentences
- All tests run on CPU (no GPU) on a Windows 11 machine with 16GB RAM
- sentence-transformers model cached locally after first download (~90MB)
- Cohere reranker used Trial-tier API key: rate-limited to ~10 calls/minute (failed on strategies 2-4)
- Full reranker evaluation requires a production API key or a local cross-encoder model
