class FixedSizeChunker:
    def __init__(self, chunk_size=500, overlap=50):
        self.chunk_size = chunk_size
        self.overlap = overlap
        if overlap >= chunk_size:
            raise ValueError("overlap must be less than chunk_size")

    def chunk(self, text):
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + self.chunk_size, len(text))
            if end < len(text):
                end = self._align_to_word_boundary(text, end)
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "start": start,
                    "end": end,
                    "index": len(chunks),
                    "strategy": "fixed_size",
                })
            if end == len(text):
                break
            start = start + self.chunk_size - self.overlap
        return chunks

    def _align_to_word_boundary(self, text, pos):
        if pos >= len(text) or text[pos] in (' ', '\n'):
            return pos
        for i in range(pos, max(pos - 50, -1), -1):
            if text[i] in (' ', '\n'):
                return i + 1
        return pos
