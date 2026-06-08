class SemanticChunker:
    def __init__(self, min_chunk_size=200, max_chunk_size=1000):
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size

    def chunk(self, text):
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        chunks = []
        current_chunk = []
        current_size = 0
        char_offset = 0

        for para in paragraphs:
            para_size = len(para)
            if current_size + para_size > self.max_chunk_size and current_size >= self.min_chunk_size:
                chunk_text = '\n\n'.join(current_chunk)
                chunks.append({
                    "text": chunk_text,
                    "paragraph_count": len(current_chunk),
                    "index": len(chunks),
                    "strategy": "semantic",
                })
                current_chunk = []
                current_size = 0
            current_chunk.append(para)
            current_size += para_size + 2

        if current_chunk:
            chunk_text = '\n\n'.join(current_chunk)
            chunks.append({
                "text": chunk_text,
                "paragraph_count": len(current_chunk),
                "index": len(chunks),
                "strategy": "semantic",
            })

        return chunks
