/**
 * Fixed-size text chunking with configurable overlap.
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.slice(start, end);
    chunks.push({
      index: chunks.length,
      text: chunkText,
      startChar: start,
      endChar: end,
    });
    start += chunkSize - overlap;
  }
  return chunks;
}

module.exports = { chunkText };
