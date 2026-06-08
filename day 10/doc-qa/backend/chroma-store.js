const { ChromaClient } = require("chromadb");

const COLLECTION_NAME = "doc-qa";
const client = new ChromaClient({ path: "http://localhost:8000" });

let collection = null;

async function getCollection() {
  if (!collection) {
    collection = await client.getOrCreateCollection({ name: COLLECTION_NAME });
  }
  return collection;
}

async function addDocument(docInfo, chunks, embeddings) {
  const col = await getCollection();

  const count = await col.count();
  const allData = await col.get();
  let maxDocIndex = -1;
  if (allData.metadatas) {
    for (const m of allData.metadatas) {
      if (m && typeof m.docIndex === "number" && m.docIndex > maxDocIndex) {
        maxDocIndex = m.docIndex;
      }
    }
  }
  const docIndex = maxDocIndex + 1;

  const ids = chunks.map((_, i) => `${count + i}`);
  const metadatas = chunks.map((c, i) => ({
    docIndex,
    index: i,
    startChar: c.startChar,
    endChar: c.endChar,
    source: docInfo.originalName || "unknown",
    originalName: docInfo.originalName,
    storedName: docInfo.storedName,
    uploadedAt: docInfo.uploadedAt,
  }));
  const documents = chunks.map((c) => c.text);

  await col.add({
    ids,
    embeddings,
    metadatas,
    documents,
  });
}

async function search(queryEmbedding, topK = 3) {
  const col = await getCollection();
  const count = await col.count();
  if (count === 0) return [];

  const results = await col.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  });

  if (!results.ids[0] || results.ids[0].length === 0) return [];

  return results.ids[0].map((id, i) => {
    const distance = results.distances[0][i];
    const similarity = Math.max(0, 1 - distance);
    const meta = results.metadatas[0][i] || {};
    return {
      id,
      docIndex: meta.docIndex ?? -1,
      index: meta.index ?? i,
      text: results.documents[0][i] || "",
      startChar: meta.startChar,
      endChar: meta.endChar,
      score: similarity,
      source: meta.source || "unknown",
    };
  });
}

async function getStats() {
  const col = await getCollection();
  try {
    const count = await col.count();
    const allData = await col.get();
    const docIndices = new Set();
    if (allData.metadatas) {
      for (const m of allData.metadatas) {
        if (m && m.originalName) docIndices.add(m.originalName);
      }
    }
    return {
      documentCount: docIndices.size,
      chunkCount: count,
      hasData: count > 0,
    };
  } catch {
    return { documentCount: 0, chunkCount: 0, hasData: false };
  }
}

async function clearStore() {
  try {
    await client.deleteCollection({ name: COLLECTION_NAME });
  } catch {
    // collection may not exist
  }
  collection = null;
}

module.exports = { addDocument, search, getStats, clearStore };
