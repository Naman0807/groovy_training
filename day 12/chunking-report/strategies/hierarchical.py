import re

class HierarchicalChunker:
    def __init__(self):
        self.heading_pattern = re.compile(r'^#{1,3}\s+|^[A-Z][A-Z\s]{2,}$', re.MULTILINE)

    def chunk(self, text):
        sections = self._split_sections(text)
        chunks = []

        for section in sections:
            paragraphs = self._split_paragraphs(section["body"])
            for para in paragraphs:
                sentences = self._split_sentences(para)
                chunk_text = " ".join(sentences)
                if chunk_text.strip():
                    chunks.append({
                        "text": chunk_text,
                        "section": section["heading"],
                        "sentence_count": len(sentences),
                        "index": len(chunks),
                        "strategy": "hierarchical",
                    })

        return chunks

    def _split_sections(self, text):
        lines = text.split('\n')
        sections = []
        current_heading = "Introduction"
        current_body = []

        for line in lines:
            if self.heading_pattern.match(line):
                if current_body:
                    sections.append({
                        "heading": current_heading.strip(),
                        "body": '\n'.join(current_body).strip(),
                    })
                current_heading = line.strip().lstrip('#').strip()
                current_body = []
            else:
                current_body.append(line)

        if current_body:
            sections.append({
                "heading": current_heading.strip(),
                "body": '\n'.join(current_body).strip(),
            })

        return sections

    def _split_paragraphs(self, text):
        return [p.strip() for p in text.split('\n\n') if p.strip()]

    def _split_sentences(self, text):
        sentences = re.split(r'(?<=[.!?])\s+', text)
        return [s.strip() for s in sentences if s.strip()]
