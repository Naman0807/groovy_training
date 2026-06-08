const fs = require("fs");
const path = require("path");
const { cosineSimilarity } = require("./embeddings");

const STORE_PATH = path.join(__dirname, "store", "vectors.json");

let store = { documents: [], chunks: [], embeddings: [] };

function load() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
}

function save() {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

async function addDocument(docInfo, chunks, embeddings) {
  store.documents.push(docInfo);
  for (let i = 0; i < chunks.length; i++) {
    store.chunks.push({
      id: `${store.documents.length - 1}-${i}`,
      docIndex: store.documents.length - 1,
      index: i,
      ...chunks[i],
    });
    store.embeddings.push(embeddings[i]);
  }
  save();
}

async function search(queryEmbedding, topK = 3) {
  if (store.embeddings.length === 0) return [];

  const scored = store.embeddings.map((emb, i) => ({
    score: cosineSimilarity(queryEmbedding, emb),
    index: i,
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK);

  return top.map(s => ({
    ...store.chunks[s.index],
    score: s.score,
    source: store.documents[store.chunks[s.index].docIndex]?.originalName || "unknown",
  }));
}

function getStats() {
  return {
    documentCount: store.documents.length,
    chunkCount: store.chunks.length,
    hasData: store.chunks.length > 0,
  };
}

function clearStore() {
  store = { documents: [], chunks: [], embeddings: [] };
  save();
}

load();

module.exports = { addDocument, search, getStats, clearStore };
