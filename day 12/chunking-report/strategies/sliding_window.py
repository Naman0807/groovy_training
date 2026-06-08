class SlidingWindowChunker:
    def __init__(self, window_size=500, stride=250):
        self.window_size = window_size
        self.stride = stride

    def chunk(self, text):
        chunks = []
        start = 0
        while start < len(text):
            end = min(start + self.window_size, len(text))
            if end < len(text):
                end = self._align_to_word_boundary(text, end)
            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "start": start,
                    "end": end,
                    "index": len(chunks),
                    "strategy": "sliding_window",
                })
            if end == len(text):
                break
            start += self.stride
            if start >= len(text):
                break
        return chunks

    def _align_to_word_boundary(self, text, pos):
        if pos >= len(text) or text[pos] in (' ', '\n'):
            return pos
        for i in range(pos, max(pos - 30, -1), -1):
            if text[i] in (' ', '\n'):
                return i + 1
        return pos
