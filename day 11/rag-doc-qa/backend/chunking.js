function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || text.length === 0) return [];

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    if (end > text.length) end = text.length;

    let chunk = text.slice(start, end);

    const chunkIndex = chunks.length;
    const startChar = start;
    const endChar = end;

    chunks.push({
      id: `chunk-${chunkIndex}`,
      text: chunk.trim(),
      index: chunkIndex,
      startChar,
      endChar,
    });

    start += chunkSize - overlap;
  }

  return chunks;
}

function chunkTextByParagraphs(text, maxChunkSize = 500, overlap = 50) {
  if (!text || text.length === 0) return [];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const para of paragraphs) {
    if ((currentChunk + "\n" + para).length > maxChunkSize && currentChunk.length > 0) {
      const startChar = text.indexOf(currentChunk);
      chunks.push({
        id: `chunk-${chunkIndex}`,
        text: currentChunk.trim(),
        index: chunkIndex,
        startChar: startChar >= 0 ? startChar : 0,
        endChar: startChar >= 0 ? startChar + currentChunk.length : currentChunk.length,
      });
      chunkIndex++;
      const words = currentChunk.split(" ");
      const overlapWords = words.slice(-Math.floor(overlap / 5)).join(" ");
      currentChunk = overlapWords + "\n" + para;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + para;
    }
  }

  if (currentChunk.trim().length > 0) {
    const startChar = text.indexOf(currentChunk);
    chunks.push({
      id: `chunk-${chunkIndex}`,
      text: currentChunk.trim(),
      index: chunkIndex,
      startChar: startChar >= 0 ? startChar : 0,
      endChar: startChar >= 0 ? startChar + currentChunk.length : currentChunk.length,
    });
  }

  return chunks;
}

module.exports = { chunkText, chunkTextByParagraphs };
