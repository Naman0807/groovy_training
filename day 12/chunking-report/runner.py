import time
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from strategies.fixed_size import FixedSizeChunker
from strategies.semantic_chunking import SemanticChunker
from strategies.sliding_window import SlidingWindowChunker
from strategies.hierarchical import HierarchicalChunker
from dotenv import load_dotenv

CHUNKER_CONFIGS = {
    "fixed_size": FixedSizeChunker(chunk_size=500, overlap=50),
    "semantic": SemanticChunker(min_chunk_size=200, max_chunk_size=1000),
    "sliding_window": SlidingWindowChunker(window_size=500, stride=250),
    "hierarchical": HierarchicalChunker(),
}

QUERIES = [
    "What is the difference between supervised and unsupervised learning?",
    "Explain how transformers differ from RNNs",
    "What are the key components of MLOps?",
    "What ethical concerns are associated with AI?",
    "How does reinforcement learning work?",
    "What is the bias-variance tradeoff?",
    "Describe the attention mechanism",
    "What are some challenges in deploying AI to production?",
    "How might AI regulation evolve in the next decade?",
    "What is transfer learning and when would you use it?",
]

GOLD_STANDARD_KEYWORDS = {
    0: ["supervised", "unsupervised", "labeled", "unlabeled"],
    1: ["transformer", "attention", "rnn", "self-attention", "parallel"],
    2: ["mlops", "deploy", "monitoring", "registry", "pipeline"],
    3: ["bias", "fairness", "privacy", "ethical", "explainability"],
    4: ["reinforcement", "agent", "reward", "policy", "environment"],
    5: ["bias-variance", "underfitting", "overfitting", "generalization"],
    6: ["attention", "self-attention", "transformer", "multi-head"],
    7: ["deploy", "drift", "monitoring", "infrastructure", "production"],
    8: ["regulation", "governance", "policy", "legal", "compliance"],
    9: ["transfer learning", "fine-tune", "pre-trained", "pretraining"],
}


def load_document(path="sample_data.txt"):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def compute_recall(chunk_text, keywords):
    text_lower = chunk_text.lower()
    matches = sum(1 for kw in keywords if kw.lower() in text_lower)
    return matches / len(keywords) if keywords else 0.0


def compute_precision(retrieved_chunks, query_idx, all_chunks, keywords):
    relevant_count = 0
    for chunk in retrieved_chunks:
        for kw in keywords:
            if kw.lower() in chunk["text"].lower():
                relevant_count += 1
                break
    return relevant_count / len(retrieved_chunks) if retrieved_chunks else 0.0


def run_strategy(strategy_name, chunker, text, model):
    start = time.time()
    chunks = chunker.chunk(text)
    chunk_time = time.time() - start

    if not chunks:
        return {"chunks": [], "chunk_count": 0, "avg_chunk_size": 0,
                "results": [], "avg_precision": 0, "avg_recall": 0, "latency": 0}

    texts = [c["text"] for c in chunks]

    embed_start = time.time()
    chunk_embeddings = model.encode(texts, show_progress_bar=False)
    embed_time = time.time() - embed_start

    avg_size = int(np.mean([len(t) for t in texts]))

    results = []
    precisions = []
    recalls = []

    for q_idx, query in enumerate(QUERIES):
        q_start = time.time()
        query_embedding = model.encode([query], show_progress_bar=False)
        similarities = cosine_similarity(query_embedding, chunk_embeddings)[0]
        top_5_indices = np.argsort(similarities)[-5:][::-1]
        query_time = time.time() - q_start

        retrieved = [chunks[i] for i in top_5_indices]
        keywords = GOLD_STANDARD_KEYWORDS[q_idx]

        precision = compute_precision(retrieved, q_idx, chunks, keywords)
        recall = max(compute_recall(c["text"], keywords) for c in retrieved)

        precisions.append(precision)
        recalls.append(recall)

        results.append({
            "query": query,
            "precision": round(precision, 2),
            "recall": round(recall, 2),
            "latency_ms": round(query_time * 1000, 1),
            "top_chunk_preview": retrieved[0]["text"][:100] if retrieved else "",
        })

    total_latency = (chunk_time + embed_time) * 1000

    return {
        "chunks": chunks,
        "chunk_count": len(chunks),
        "avg_chunk_size": avg_size,
        "results": results,
        "avg_precision": round(np.mean(precisions), 2),
        "avg_recall": round(np.mean(recalls), 2),
        "latency": round(total_latency, 1),
    }


def try_cohere_rerank(strategy_results, api_key=None):
    if not api_key:
        print("  [SKIP] No Cohere API key provided")
        return None

    try:
        import cohere
        co = cohere.Client(api_key)

        rerank_results = {}
        for q_idx, query in enumerate(QUERIES):
            top_20_docs = strategy_results["chunks"][:20]
            doc_texts = [d["text"] for d in top_20_docs]

            response = co.rerank(
                model="rerank-english-v3.0",
                query=query,
                documents=doc_texts,
                top_n=5,
            )

            reranked_indices = [r.index for r in response.results]
            reranked_chunks = [top_20_docs[i] for i in reranked_indices]
            keywords = GOLD_STANDARD_KEYWORDS[q_idx]

            precision = compute_precision(reranked_chunks, q_idx, top_20_docs, keywords)
            rerank_results[q_idx] = {
                "precision": round(precision, 2),
                "reranked_order": reranked_indices,
            }

        return rerank_results

    except ImportError:
        print("  [SKIP] cohere package not installed")
        return None
    except Exception as e:
        print(f"  [ERROR] Cohere reranker failed: {e}")
        return None


def print_report(all_results, rerank_data=None):
    print("=" * 80)
    print("CHUNKING STRATEGY COMPARISON REPORT")
    print("=" * 80)

    header = f"{'Strategy':<20} {'Chunks':<8} {'Avg Size':<10} {'Prec@5':<8} {'Recall@5':<10} {'Latency(ms)':<10}"
    print("\n" + header)
    print("-" * len(header))

    for name, res in all_results.items():
        print(f"{name:<20} {res['chunk_count']:<8} {res['avg_chunk_size']:<10} "
              f"{res['avg_precision']:<8} {res['avg_recall']:<10} {res['latency']:<10}")

    print("\n" + "-" * 80)
    print("\nPER-QUERY PRECISION@5 BREAKDOWN:")
    print("-" * 80)

    q_header = f"{'Query':<10}"
    for name in all_results:
        q_header += f" {name:<16}"
    print("\n" + q_header)
    print("-" * len(q_header))

    for q_idx in range(len(QUERIES)):
        row = f"Q{q_idx+1:<9}"
        for name in all_results:
            row += f" {all_results[name]['results'][q_idx]['precision']:<16}"
        print(row)

    if rerank_data:
        print("\n" + "-" * 80)
        print("\nRERANKER IMPROVEMENT (Precision@5)")
        print("-" * 80)
        r_header = f"{'Strategy':<20} {'No Rerank':<12} {'Rerank':<12} {'Δ':<8}"
        print("\n" + r_header)
        print("-" * len(r_header))

        for name in all_results:
            base_prec = all_results[name]["avg_precision"]
            if name in rerank_data:
                rerank_precs = [rerank_data[name][q]["precision"] for q in range(len(QUERIES))]
                avg_rerank = round(np.mean(rerank_precs), 2)
                delta = round(avg_rerank - base_prec, 2)
                print(f"{name:<20} {base_prec:<12} {avg_rerank:<12} +{delta:<6}")


def main():
    load_dotenv()
    print("Loading document...")
    text = load_document()
    print(f"Document length: {len(text)} chars\n")

    print("Loading embedding model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded.\n")

    all_results = {}
    all_strategy_chunks = {}

    for name, chunker in CHUNKER_CONFIGS.items():
        print(f"\n{'='*60}")
        print(f"Running: {name}")
        print(f"{'='*60}")
        result = run_strategy(name, chunker, text, model)
        all_results[name] = result
        all_strategy_chunks[name] = result["chunks"]
        print(f"  Chunks created: {result['chunk_count']}")
        print(f"  Avg chunk size: {result['avg_chunk_size']} chars")
        print(f"  Avg Precision@5: {result['avg_precision']}")
        print(f"  Avg Recall@5: {result['avg_recall']}")
        print(f"  Retrieval latency: {result['latency']}ms")

    print("\n" + "=" * 80)
    print("Attempting Cohere reranker (hierarchical chunks)...")
    print("=" * 80)

    import os
    api_key = os.environ.get("COHERE_API_KEY", "")
    rerank_data = {}
    for name in all_results:
        print(f"\nReranking {name}...")
        rr = try_cohere_rerank(all_results[name], api_key)
        if rr is not None:
            rerank_data[name] = rr

    print_report(all_results, rerank_data if rerank_data else None)

    print("\n" + "=" * 80)
    print("Done!")


if __name__ == "__main__":
    main()
